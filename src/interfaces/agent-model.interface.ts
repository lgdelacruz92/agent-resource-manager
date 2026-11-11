export interface AgentData {
  id: number
  name: string
  status: string
  url: string | null
}

export interface AgentModelInterface extends AgentData {
  update(status: string): Promise<void>
}
