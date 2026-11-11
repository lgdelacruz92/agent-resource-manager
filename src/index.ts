// Runs agent checks and assignment reconciliation against the prepared shared database.
import { AssignmentReconciler } from "./components/assignment-reconciler.js"
import { Agents } from "./components/agents.js"
import { Assignments } from "./components/assignments.js"
import { Executions } from "./components/executions.js"
import { OpencodeAgentClient } from "./components/opencode-agent-client.js"
import { ResourceManager } from "./components/resource-manager.js"
import { SharedLock } from "./components/shared-lock.js"
import { Tickets } from "./components/tickets.js"
import { Vikunja } from "./components/vikunja.js"
import { config } from "./config.js"
import { openDatabase } from "./db/database.js"
import { runProcessLoop } from "./process-loop.js"

const database = openDatabase(config.databasePath)
const agents = new Agents(database)
const tickets = new Tickets(database)
const assignments = new Assignments(database)
const executions = new Executions(database)
const createClient = (url: string) => new OpencodeAgentClient(url, config.opencodeHeaders)
const agentChecks = new ResourceManager(agents, createClient)
const schedulingLock = new SharedLock(database)
const reconciler = new AssignmentReconciler(tickets, agents, assignments, executions, new Vikunja(config.vikunja), schedulingLock, createClient, config.executionTimeoutMs)
const managerLock = new SharedLock(database, "resource-manager-pass")
const manager = {
  async runOnce(): Promise<void> {
    // Check even when no assignments are ready: a stale lock can block the scheduler.
    await schedulingLock.warnIfStale()
    const owner = await managerLock.tryAcquire()
    if (!owner) {
      console.warn("Resource Manager pass skipped: resource-manager-pass lock is held")
      return
    }
    try {
      const errors: unknown[] = []
      for (const pass of [agentChecks, reconciler]) {
        try { await pass.runOnce() } catch (error) { errors.push(error) }
      }
      if (errors.length) throw new AggregateError(errors, "Resource Manager pass failed")
    } finally {
      await managerLock.release(owner)
    }
  },
}
const controller = new AbortController()

process.on("SIGINT", () => controller.abort())
process.on("SIGTERM", () => controller.abort())

runProcessLoop(manager, config.pollMs, controller.signal)
  .catch((error: unknown) => {
    console.error("Resource Manager loop failed:", error)
    process.exitCode = 1
  })
  .finally(() => database.close())
