import type { AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"
import type { AssignmentsInterface } from "../interfaces/assignments.interface.js"

export class Assignments implements AssignmentsInterface {
  constructor(private readonly assignments: AssignmentModelInterface[] = []) {}

  find(assignmentId: number): AssignmentModelInterface | undefined {
    return this.assignments.find((assignment) => assignment.id === assignmentId)
  }

  async list(): Promise<AssignmentModelInterface[]> {
    return this.assignments
  }
}
