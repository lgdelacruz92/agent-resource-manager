import type { DatabaseSync } from "node:sqlite"
import { number, text, type Row } from "../db/row.js"
import type { TicketModelInterface } from "../interfaces/ticket-model.interface.js"
import type { TicketsInterface } from "../interfaces/tickets.interface.js"

export class Tickets implements TicketsInterface {
  constructor(private readonly db: DatabaseSync) {}

  find(ticketId: number): TicketModelInterface | undefined {
    const row = this.db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId)
    return row ? this._model(row) : undefined
  }

  async list(): Promise<TicketModelInterface[]> {
    return this.db.prepare("SELECT * FROM tickets ORDER BY id").all().map((row) => this._model(row))
  }

  private _model(row: Row): TicketModelInterface {
    const present = number(row, "present_on_board")
    if (present !== 0 && present !== 1) throw new Error("Invalid present_on_board in shared database")
    return {
      id: number(row, "id"), vikunjaTaskId: number(row, "vikunja_task_id"), title: text(row, "title"),
      status: text(row, "status"), priority: number(row, "priority"), presentOnBoard: present === 1,
    }
  }
}
