import type { ExecutionModelInterface } from "../interfaces/execution-model.interface.js"
import type { ExecutionsInterface } from "../interfaces/executions.interface.js"

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
}
