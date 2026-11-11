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
  get(): Promise<ExecutionData | null>
  create(): Promise<ExecutionModelInterface>
  update(execution?: ExecutionData): Promise<void>
  delete(): Promise<void>
}
