import type { DatabaseSync } from "node:sqlite"
import type { ExecutionData, ExecutionModelInterface, ExecutionStatus } from "../interfaces/execution-model.interface.js"
import { number, text, nullableText } from "../db/row.js"

export class ExecutionModel implements ExecutionModelInterface {
  id: number
  assignmentId: number
  sessionId: string | null
  status: ExecutionStatus
  createdAt: string
  workRequestedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  failureReason: string | null

  constructor(private readonly db: DatabaseSync, execution: ExecutionData) {
    this.id = execution.id
    this.assignmentId = execution.assignmentId
    this.sessionId = execution.sessionId
    this.status = execution.status
    this.createdAt = execution.createdAt
    this.workRequestedAt = execution.workRequestedAt
    this.startedAt = execution.startedAt
    this.finishedAt = execution.finishedAt
    this.failureReason = execution.failureReason
  }

  async get(): Promise<ExecutionData | null> {
    const row = this.db.prepare("SELECT * FROM executions WHERE id = ?").get(this.id)
    if (!row) return null
    const status = text(row, "status")
    if (status !== "starting" && status !== "running" && status !== "succeeded" && status !== "failed") {
      throw new Error(`Invalid execution status ${status}`)
    }
    return {
      id: number(row, "id"), assignmentId: number(row, "assignment_id"), sessionId: nullableText(row, "session_id"),
      status, createdAt: text(row, "created_at"), workRequestedAt: nullableText(row, "work_requested_at"),
      startedAt: nullableText(row, "started_at"), finishedAt: nullableText(row, "finished_at"), failureReason: nullableText(row, "failure_reason"),
    }
  }

  async create(): Promise<ExecutionModelInterface> {
    const result = this.db.prepare(`
      INSERT INTO executions (assignment_id, session_id, status, created_at, work_requested_at, started_at, finished_at, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(this.assignmentId, this.sessionId, this.status, this.createdAt, this.workRequestedAt,
      this.startedAt, this.finishedAt, this.failureReason)
    const id = Number(result.lastInsertRowid)
    if (!Number.isSafeInteger(id)) throw new Error("Created execution ID is not a safe integer")
    this.id = id
    return this
  }

  async update(execution: ExecutionData = this): Promise<void> {
    if (execution.id !== this.id || execution.assignmentId !== this.assignmentId) {
      throw new Error("Cannot update a different execution or change its assignment")
    }
    const result = this.db.prepare(`
      UPDATE executions SET session_id = ?, status = ?, created_at = ?, work_requested_at = ?, started_at = ?,
        finished_at = ?, failure_reason = ? WHERE id = ? AND assignment_id = ?
    `).run(execution.sessionId, execution.status, execution.createdAt, execution.workRequestedAt, execution.startedAt,
      execution.finishedAt, execution.failureReason, this.id, this.assignmentId)
    if (result.changes !== 1) throw new Error(`Execution ${this.id} was not found`)
  }

  async delete(): Promise<void> {
    const result = this.db.prepare("DELETE FROM executions WHERE id = ?").run(this.id)
    if (result.changes !== 1) throw new Error(`Execution ${this.id} was not found`)
  }
}
