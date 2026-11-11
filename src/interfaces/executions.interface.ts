import type { ExecutionModelInterface } from "./execution-model.interface.js"
import type { AssignmentModelInterface } from "./assignment-model.interface.js"

export interface ExecutionsInterface {
  find(executionId: number): ExecutionModelInterface | undefined
  list(): Promise<ExecutionModelInterface[]>
  getLatest(assignmentId: number): ExecutionModelInterface | undefined
  create(assignment: AssignmentModelInterface): Promise<ExecutionModelInterface>
}
