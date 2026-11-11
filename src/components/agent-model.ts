import type { DatabaseSync } from "node:sqlite"
import type { AgentData, AgentModelInterface } from "../interfaces/agent-model.interface.js"

export class AgentModel implements AgentModelInterface {
  id: number
  name: string
  status: string
  url: string | null

  constructor(private readonly db: DatabaseSync, agent: AgentData) {
    this.id = agent.id
    this.name = agent.name
    this.status = agent.status
    this.url = agent.url
  }

  async update(status: string): Promise<void> {
    const result = this.db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(status, this.id)
    if (result.changes !== 1) {
      throw new Error(`Agent ${this.id} was not found`)
    }
    this.status = status
  }
}
