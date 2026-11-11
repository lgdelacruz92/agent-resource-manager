import type { DatabaseSync } from "node:sqlite"
import type { ExecutionData, ExecutionModelInterface, ExecutionStatus } from "../interfaces/execution-model.interface.js"

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

  async create(): Promise<ExecutionModelInterface> {
    const result = this.db.prepare(`
      INSERT INTO executions (assignment_id, status, created_at) VALUES (?, ?, ?)
    `).run(this.assignmentId, this.status, this.createdAt)
    const id = Number(result.lastInsertRowid)
    if (!Number.isSafeInteger(id)) throw new Error("Created execution ID is not a safe integer")
    this.id = id
    return this
  }

  async update(): Promise<void> {
    const result = this.db.prepare(`
      UPDATE executions SET session_id = ?, status = ?, work_requested_at = ?, started_at = ?,
        finished_at = ?, failure_reason = ? WHERE id = ? AND assignment_id = ?
    `).run(this.sessionId, this.status, this.workRequestedAt, this.startedAt, this.finishedAt,
      this.failureReason, this.id, this.assignmentId)
    if (result.changes !== 1) throw new Error(`Execution ${this.id} was not found`)
  }
}
