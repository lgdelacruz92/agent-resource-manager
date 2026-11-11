import type { ExecutionModelInterface } from "./execution-model.interface.js"

export interface ExecutionsInterface {
  find(executionId: number): ExecutionModelInterface | undefined
  list(): Promise<ExecutionModelInterface[]>
  getLatest(): ExecutionModelInterface | undefined
}
