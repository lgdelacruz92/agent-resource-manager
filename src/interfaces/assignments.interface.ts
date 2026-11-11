import type { AssignmentModelInterface } from "./assignment-model.interface.js"

export interface AssignmentsInterface {
  find(assignmentId: number): AssignmentModelInterface | undefined
  list(): Promise<AssignmentModelInterface[]>
}
