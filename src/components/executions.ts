import type { ExecutionModelInterface } from "../interfaces/execution-model.interface.js"
import type { ExecutionsInterface } from "../interfaces/executions.interface.js"
import type { AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"

export class Executions implements ExecutionsInterface {
  private readonly latest: ExecutionModelInterface | undefined
  constructor(private readonly executions: ExecutionModelInterface[] = []) { }
  getLatest(): ExecutionModelInterface | undefined{
    return this.latest;
  }

  find(executionId: number): ExecutionModelInterface | undefined {
    return this.executions.find((execution) => execution.id === executionId)
  }

  async list(): Promise<ExecutionModelInterface[]> {
    return this.executions
  }

  async create(assignment: AssignmentModelInterface): Promise<ExecutionModelInterface> {
    const id = this.executions.reduce((highest, execution) => Math.max(highest, execution.id), 0) + 1
    const execution: ExecutionModelInterface = {
      id,
      assignmentId: assignment.id,
      sessionId: null,
      status: "starting",
      createdAt: new Date().toISOString(),
      workRequestedAt: null,
      startedAt: null,
      finishedAt: null,
      failureReason: null,
    }
    this.executions.push(execution)
    return execution
  }
}
