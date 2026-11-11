import type { DatabaseSync } from "node:sqlite"
import { AssignmentModel } from "./assignment-model.js"
import type { AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"
import type { AssignmentsInterface } from "../interfaces/assignments.interface.js"
import type { AgentModelInterface } from "../interfaces/agent-model.interface.js"
import type { TicketModelInterface } from "../interfaces/ticket-model.interface.js"
import { number, text, nullableText, type Row } from "../db/row.js"

export class Assignments implements AssignmentsInterface {
  constructor(private readonly db: DatabaseSync) {}

  find(assignmentId: number): AssignmentModelInterface | undefined {
    const row = this.db.prepare("SELECT * FROM assignments WHERE id = ?").get(assignmentId)
    return row ? this._model(row) : undefined
  }

  async list(): Promise<AssignmentModelInterface[]> {
    return this.db.prepare("SELECT * FROM assignments ORDER BY id").all().map((row) => this._model(row))
  }

  async listIncomplete(): Promise<AssignmentModelInterface[]> {
    return this.db.prepare("SELECT * FROM assignments WHERE completed_at IS NULL ORDER BY id").all().map((row) => this._model(row))
  }

  async create(ticket: TicketModelInterface, agent: AgentModelInterface): Promise<AssignmentModelInterface> {
    const assignment = new AssignmentModel(this.db, {
      id: 0,
      ticketId: ticket.id,
      agentId: agent.id,
      status: "assigned",
      assignedAt: new Date().toISOString(),
      completedAt: null,
    })
    await assignment.create()
    return assignment
  }

  private _model(row: Row): AssignmentModelInterface {
    return new AssignmentModel(this.db, {
      id: number(row, "id"), ticketId: number(row, "ticket_id"), agentId: number(row, "agent_id"),
      status: text(row, "status"), assignedAt: text(row, "assigned_at"), completedAt: nullableText(row, "completed_at"),
    })
  }
}
