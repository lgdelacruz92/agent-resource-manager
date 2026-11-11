export interface AssignmentData {
  id: number
  ticketId: number
  agentId: number
  status: string
  assignedAt: string
  completedAt: string | null
}

export interface AssignmentModelInterface extends AssignmentData {
  get(): Promise<AssignmentData | null>
  create(): Promise<AssignmentModelInterface>
  update(): Promise<void>
  delete(): Promise<void>
}
