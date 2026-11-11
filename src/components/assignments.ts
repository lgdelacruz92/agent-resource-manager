import type { AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"
import type { AssignmentsInterface } from "../interfaces/assignments.interface.js"
import type { AgentModelInterface } from "../interfaces/agent-model.interface.js"
import type { TicketModelInterface } from "../interfaces/ticket-model.interface.js"

export class Assignments implements AssignmentsInterface {
  constructor(private readonly assignments: AssignmentModelInterface[] = []) {}

  find(assignmentId: number): AssignmentModelInterface | undefined {
    return this.assignments.find((assignment) => assignment.id === assignmentId)
  }

  async list(): Promise<AssignmentModelInterface[]> {
    return this.assignments
  }

  async create(ticket: TicketModelInterface, agent: AgentModelInterface): Promise<AssignmentModelInterface> {
    const id = this.assignments.reduce((highest, assignment) => Math.max(highest, assignment.id), 0) + 1
    const assignment: AssignmentModelInterface = {
      id,
      ticketId: ticket.id,
      agentId: agent.id,
      status: "assigned",
      assignedAt: new Date().toISOString(),
      completedAt: null,
    }
    this.assignments.push(assignment)
    return assignment
  }
}
