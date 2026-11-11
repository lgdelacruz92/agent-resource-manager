import type { AssignmentModelInterface } from "./assignment-model.interface.js"
import type { AgentModelInterface } from "./agent-model.interface.js"
import type { TicketModelInterface } from "./ticket-model.interface.js"

export interface AssignmentsInterface {
  find(assignmentId: number): AssignmentModelInterface | undefined
  list(): Promise<AssignmentModelInterface[]>
  create(ticket: TicketModelInterface, agent: AgentModelInterface): Promise<AssignmentModelInterface>
}
