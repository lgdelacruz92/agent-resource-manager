export interface AgentData {
  id: number
  name: string
  status: string
  url: string | null
}

export interface AgentModelInterface extends AgentData {
  get(): Promise<AgentData | null>
  create(): Promise<AgentModelInterface>
  update(agent: string | AgentData): Promise<void>
  delete(): Promise<void>
}
