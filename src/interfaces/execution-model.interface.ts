import type { ExecutionStatus } from "./resource-manager-database.interface.js"

export interface ExecutionModelInterface {
  id: number
  assignmentId: number
  sessionId: string | null
  status: ExecutionStatus
  createdAt: string
  workRequestedAt: string | null
  startedAt: string | null
  finishedAt: string | null
  failureReason: string | null
}
