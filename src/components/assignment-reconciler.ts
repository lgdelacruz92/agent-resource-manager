// Coordinates assignments without accessing the database directly.
import type { AgentModelInterface } from "../interfaces/agent-model.interface.js"
import type { AgentsInterface } from "../interfaces/agents.interface.js"
import type { AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"
import type { AssignmentsInterface } from "../interfaces/assignments.interface.js"
import type { ExecutionModelInterface } from "../interfaces/execution-model.interface.js"
import type { ExecutionsInterface } from "../interfaces/executions.interface.js"
import type { OpencodeAgentClientInterface, OpencodeSessionActivity } from "../interfaces/opencode-agent-client.interface.js"
import type { TicketModelInterface } from "../interfaces/ticket-model.interface.js"
import type { TicketsInterface } from "../interfaces/tickets.interface.js"
import type { VikunjaInterface, VikunjaTask } from "../interfaces/vikunja.interface.js"

interface Lock {
  tryAcquire(): Promise<string | null>
  release(owner: string): Promise<void>
}

export class AssignmentReconciler {
  // A pre-prompt baseline prevents treating an old idle session as completed work.
  private readonly locallySent = new Map<number, number | null>()

  constructor(
    private readonly tickets: TicketsInterface,
    private readonly agents: AgentsInterface,
    private readonly assignments: AssignmentsInterface,
    private readonly executions: ExecutionsInterface,
    private readonly vikunja: VikunjaInterface,
    private readonly lock: Lock,
    private readonly createClient: (url: string) => OpencodeAgentClientInterface,
    private readonly timeoutMs: number | null = null,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async runOnce(): Promise<void> {
    const errors: unknown[] = []
    for (const assignment of await this.assignments.listIncomplete()) {
      try {
        const agent = this.agents.find(assignment.agentId)
        const ticket = this.tickets.find(assignment.ticketId)
        if (!agent || !ticket) throw new Error(`Assignment ${assignment.id} has a missing agent or ticket`)
        await this._reconcile(assignment, ticket, agent)
      } catch (error) {
        console.error(`Could not reconcile assignment ${assignment.id}:`, error)
        errors.push(error)
      }
    }
    if (errors.length) throw new AggregateError(errors, "One or more assignments could not be reconciled")
  }

  private async _reconcile(assignment: AssignmentModelInterface, ticket: TicketModelInterface, agent: AgentModelInterface): Promise<void> {
    const execution = this.executions.getLatest(assignment.id)
    if (execution?.status === "failed") {
      // move vikunja ticket to retry
      // update assignment status
      await assignment.update({...assignment, status: 'failed'});
      // update ticket status
      await ticket.update({...ticket, status: 'Retry'});
      // sync vikunja board
      await this.vikunja. moveToColumn(ticket.vikunjaTaskId, 'Retry')
      return
    }
    if (execution?.status === "succeeded") {
      await this._finishAssignment(assignment, ticket, agent, "succeeded")
      return
    }
    if (!agent.url) throw new Error(`Agent ${agent.id} has no URL; assignment remains reserved`)
    const client = this.createClient(agent.url)
    if (!execution) {
      const task = await this.vikunja.getTask(ticket.vikunjaTaskId)
      const created = await this.executions.create(assignment)
      await this._startSession(assignment, ticket, created, agent, client, task)
      return
    }
    if (!execution.sessionId) {
      if (execution.workRequestedAt !== null) throw new Error(`Execution ${execution.id} has a recorded request but no session ID`)
      const task = await this.vikunja.getTask(ticket.vikunjaTaskId)
      await this._startSession(assignment, ticket, execution, agent, client, task)
      return
    }
    await this._monitor(assignment, ticket, agent, execution, client)
  }

  private async _startSession(assignment: AssignmentModelInterface, ticket: TicketModelInterface, execution: ExecutionModelInterface, agent: AgentModelInterface, client: OpencodeAgentClientInterface, task: VikunjaTask): Promise<void> {
    if (agent.status === "needs_review") return
    const state = await client.state()
    if (state === "unreachable") {
      await this._fail(execution, agent, client, "agent unreachable", true)
      return
    }
    if (state !== "idle") return
    execution.sessionId = await client.createSession(task.title)
    await execution.update()
    await this._send(assignment, ticket, agent, execution, client, task)
  }

  private async _send(assignment: AssignmentModelInterface, ticket: TicketModelInterface, agent: AgentModelInterface, execution: ExecutionModelInterface, client: OpencodeAgentClientInterface, task: VikunjaTask): Promise<void> {
    if (!execution.sessionId) throw new Error(`Execution ${execution.id} has no session`)
    const activity = await client.sessionActivity(execution.sessionId)
    if (activity.state !== "idle") throw new Error(`Cannot send to session ${execution.sessionId}: state is ${activity.state}`)
    this.locallySent.set(execution.id, activity.busyAt)
    console.log(`Sending work for execution ${execution.id}, session ${execution.sessionId}`)
    let promptError: unknown
    let promptFailed = false
    try {
      await client.prompt(execution.sessionId, `${task.title}\n\n${task.description}`)
    } catch (error) {
      promptFailed = true
      promptError = error
    }
    try {
      // A sent but uncertain request counts once this timestamp is recorded.
      execution.workRequestedAt = this._timestamp()
      await execution.update()
      await this._markInProgress(assignment, ticket, agent)
    } catch (error) {
      if (promptFailed) throw new AggregateError([promptError, error], "Prompt and progress recording failed", { cause: error })
      throw error
    }
    if (promptFailed) throw promptError
  }

  private async _monitor(assignment: AssignmentModelInterface, ticket: TicketModelInterface, agent: AgentModelInterface, execution: ExecutionModelInterface, client: OpencodeAgentClientInterface): Promise<void> {
    if (!execution.sessionId) throw new Error(`Execution ${execution.id} has no session`)
    const activity = await client.sessionActivity(execution.sessionId)
    if (activity.state === "unreachable") {
      await this._fail(execution, agent, client, "agent unreachable", true)
      return
    }
    if (activity.state === "missing") {
      await this._fail(execution, agent, client, "session missing", false)
      return
    }
    if (activity.state === "unknown") return
    if (execution.workRequestedAt === null) {
      if (activity.state === "idle" && agent.status !== "needs_review") {
        await this._send(assignment, ticket, agent, execution, client, await this.vikunja.getTask(ticket.vikunjaTaskId))
      }
      return
    }
    if (!await this._markInProgress(assignment, ticket, agent)) return
    const requestedAt = Date.parse(execution.workRequestedAt)
    if (!Number.isFinite(requestedAt)) throw new Error(`Execution ${execution.id} has an invalid work request time`)
    const finishedNewWork = this._hasFinishedNewWork(execution.id, activity)
    if (this.timeoutMs !== null && (activity.state === "busy" || (this.locallySent.has(execution.id) && !finishedNewWork))
      && this.now().getTime() - requestedAt >= this.timeoutMs) {
      await this._fail(execution, agent, client, "execution timed out", true)
      return
    }
    if (activity.state === "busy") {
      this.locallySent.delete(execution.id)
      if (execution.status === "starting") {
        execution.status = "running"
        execution.startedAt ??= this._timestamp()
        await execution.update()
      }
      return
    }
    if (this.locallySent.has(execution.id)) {
      if (!finishedNewWork) return
      this.locallySent.delete(execution.id)
    }
    // On restart there is no local baseline; idle and ready is accepted.
    const state = await client.state()
    if (state === "unreachable") {
      await this._fail(execution, agent, client, "agent unreachable", true)
    } else if (state === "idle") {
      execution.status = "succeeded"
      execution.finishedAt = this._timestamp()
      await execution.update()
    }
  }

  private _hasFinishedNewWork(id: number, activity: OpencodeSessionActivity): boolean {
    const previousBusy = this.locallySent.get(id) ?? null
    return this.locallySent.has(id) && activity.busyAt !== null && activity.idleAt !== null
      && (previousBusy === null || activity.busyAt > previousBusy) && activity.idleAt >= activity.busyAt
  }

  private async _markInProgress(assignment: AssignmentModelInterface, ticket: TicketModelInterface, agent: AgentModelInterface): Promise<boolean> {
    if (assignment.status === "in_progress") {
      if (agent.status === "idle") await agent.update("busy")
      return true
    }
    return this._withLock(async () => {
      const current = this.assignments.find(assignment.id)
      if (!current || current.completedAt !== null) return false
      if (current.status !== "in_progress") {
        // Do not move a missing or externally completed card back into progress.
        const column = await this.vikunja.getTaskColumn(ticket.vikunjaTaskId)
        if (column === null || column === "Done") return false
        await this.vikunja.moveToColumn(ticket.vikunjaTaskId, "In progress")
        current.status = "in_progress"
        await current.update()
      }
      if (agent.status === "idle") await agent.update("busy")
      assignment.status = "in_progress"
      return true
    })
  }

  private async _fail(execution: ExecutionModelInterface, agent: AgentModelInterface, client: OpencodeAgentClientInterface, reason: string, review: boolean): Promise<void> {
    if (review) await agent.update("needs_review")
    execution.status = "failed"
    execution.finishedAt = this._timestamp()
    execution.failureReason = reason
    await execution.update()
    this.locallySent.delete(execution.id)
    if (execution.sessionId && reason !== "session missing") {
      try { await client.abort(execution.sessionId) } catch (error) { console.error(`Could not stop session ${execution.sessionId}:`, error) }
    }
  }

  private async _finishAssignment(assignment: AssignmentModelInterface, ticket: TicketModelInterface, agent: AgentModelInterface, outcome: "succeeded" | "failed"): Promise<void> {
    await this._withLock(async () => {
      const current = this.assignments.find(assignment.id)
      if (!current || current.completedAt !== null) return false
      if (outcome === "succeeded") {
        if (current.status !== "in_progress" || await this.vikunja.getTaskColumn(ticket.vikunjaTaskId) !== "Done") return false
        if (!agent.url || agent.status === "needs_review") return false
        const state = await this.createClient(agent.url).state()
        if (state === "unreachable") await agent.update("needs_review")
        if (state !== "idle") return false
        if (agent.status !== "idle") await agent.update("idle")
      } else {
        if (agent.status !== "needs_review") {
          if (!agent.url) return false
          const state = await this.createClient(agent.url).state()
          if (state === "unknown") return false
          if (state === "unreachable") await agent.update("needs_review")
          if (state === "busy" && agent.status !== "busy") await agent.update("busy")
          if (state === "idle" && agent.status !== "idle") await agent.update("idle")
        }
        await this.vikunja.moveToColumn(ticket.vikunjaTaskId, "Retry")
      }
      current.status = outcome
      current.completedAt = this._timestamp()
      await current.update()
      return true
    })
  }

  private async _withLock(action: () => Promise<boolean>): Promise<boolean> {
    const owner = await this.lock.tryAcquire()
    if (!owner) return false
    let actionError: unknown
    try {
      return await action()
    } catch (error) {
      actionError = error
      throw error
    } finally {
      try {
        await this.lock.release(owner)
      } catch (error) {
        // eslint-disable-next-line no-unsafe-finally, preserve-caught-error
        if (actionError !== undefined) throw new AggregateError([actionError, error], "Action and lock release failed")
        // eslint-disable-next-line no-unsafe-finally
        throw error
      }
    }
  }

  private _timestamp(): string { return this.now().toISOString() }
}
