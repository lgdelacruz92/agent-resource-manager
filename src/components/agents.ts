import type { AgentsInterface } from "../interfaces/agents.interface.js"
import type { Agent } from "../types/agent.type.js"

// An in-memory stand-in; changes are lost when this instance is discarded.
export class Agents implements AgentsInterface {
  private readonly agents: Agent[]

  constructor(agents: Agent[] = []) {
  }

  async list(): Promise<Agent[]> {
    return []
  }

  async update(agentId: number, status: string): Promise<void> {
  }
}
