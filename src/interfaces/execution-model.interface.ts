export type ExecutionStatus = "starting" | "running" | "succeeded" | "failed"

export interface ExecutionData {
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

export interface ExecutionModelInterface extends ExecutionData {
  create(): Promise<ExecutionModelInterface>
  update(): Promise<void>
}
