import type { DatabaseSync } from "node:sqlite"
import type { AssignmentData, AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"

export class AssignmentModel implements AssignmentModelInterface {
  id: number
  ticketId: number
  agentId: number
  status: string
  assignedAt: string
  completedAt: string | null

  constructor(private readonly db: DatabaseSync, assignment: AssignmentData) {
    this.id = assignment.id
    this.ticketId = assignment.ticketId
    this.agentId = assignment.agentId
    this.status = assignment.status
    this.assignedAt = assignment.assignedAt
    this.completedAt = assignment.completedAt
  }

  async get(): Promise<AssignmentData | null> {
    const row = this.db.prepare("SELECT id, ticket_id, agent_id, status, assigned_at, completed_at FROM assignments WHERE id = ?").get(this.id)
    if (!row) return null
    if (typeof row.id !== "number" || !Number.isSafeInteger(row.id)
      || typeof row.ticket_id !== "number" || !Number.isSafeInteger(row.ticket_id)
      || typeof row.agent_id !== "number" || !Number.isSafeInteger(row.agent_id)
      || typeof row.status !== "string" || typeof row.assigned_at !== "string"
      || (typeof row.completed_at !== "string" && row.completed_at !== null)) {
      throw new Error("Invalid assignment row in shared database")
    }
    return {
      id: row.id,
      ticketId: row.ticket_id,
      agentId: row.agent_id,
      status: row.status,
      assignedAt: row.assigned_at,
      completedAt: row.completed_at,
    }
  }

  async create(): Promise<AssignmentModelInterface> {
    const result = this.db.prepare(`
      INSERT INTO assignments (ticket_id, agent_id, status, assigned_at, completed_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(this.ticketId, this.agentId, this.status, this.assignedAt, this.completedAt)
    const id = Number(result.lastInsertRowid)
    if (!Number.isSafeInteger(id)) throw new Error("Created assignment ID is not a safe integer")
    this.id = id
    return this
  }

  async update(): Promise<void> {
    const result = this.db.prepare(`
      UPDATE assignments SET ticket_id = ?, agent_id = ?, status = ?, assigned_at = ?, completed_at = ?
      WHERE id = ?
    `).run(this.ticketId, this.agentId, this.status, this.assignedAt, this.completedAt, this.id)
    if (result.changes !== 1) throw new Error(`Assignment ${this.id} was not found`)
  }

  async delete(): Promise<void> {
    const result = this.db.prepare(`
      DELETE FROM assignments WHERE id = ?
        AND NOT EXISTS (SELECT 1 FROM executions WHERE assignment_id = ?)
    `).run(this.id, this.id)
    if (result.changes !== 1) throw new Error(`Assignment ${this.id} was not found or has executions`)
  }
}
