import type { DatabaseSync } from "node:sqlite"
import { number, text, nullableText, type Row } from "../db/row.js"
import type { ExecutionModelInterface } from "../interfaces/execution-model.interface.js"
import type { ExecutionsInterface } from "../interfaces/executions.interface.js"
import type { AssignmentModelInterface } from "../interfaces/assignment-model.interface.js"
import { ExecutionModel } from "./execution-model.js"

export class Executions implements ExecutionsInterface {
  constructor(private readonly db: DatabaseSync) {}

  getLatest(assignmentId: number): ExecutionModelInterface | undefined {
    const row = this.db.prepare("SELECT * FROM executions WHERE assignment_id = ? ORDER BY id DESC LIMIT 1").get(assignmentId)
    return row ? this._model(row) : undefined
  }

  find(executionId: number): ExecutionModelInterface | undefined {
    const row = this.db.prepare("SELECT * FROM executions WHERE id = ?").get(executionId)
    return row ? this._model(row) : undefined
  }

  async list(): Promise<ExecutionModelInterface[]> {
    return this.db.prepare("SELECT * FROM executions ORDER BY id").all().map((row) => this._model(row))
  }

  async create(assignment: AssignmentModelInterface): Promise<ExecutionModelInterface> {
    const execution = new ExecutionModel(this.db, {
      id: 0, assignmentId: assignment.id, sessionId: null, status: "starting", createdAt: new Date().toISOString(),
      workRequestedAt: null, startedAt: null, finishedAt: null, failureReason: null,
    })
    return execution.create()
  }

  private _model(row: Row): ExecutionModelInterface {
    const status = text(row, "status")
    if (status !== "starting" && status !== "running" && status !== "succeeded" && status !== "failed") {
      throw new Error(`Invalid execution status ${status}`)
    }
    return new ExecutionModel(this.db, {
      id: number(row, "id"), assignmentId: number(row, "assignment_id"), sessionId: nullableText(row, "session_id"),
      status, createdAt: text(row, "created_at"), workRequestedAt: nullableText(row, "work_requested_at"),
      startedAt: nullableText(row, "started_at"), finishedAt: nullableText(row, "finished_at"), failureReason: nullableText(row, "failure_reason"),
    })
  }
}
