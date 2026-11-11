import type { DatabaseSync } from "node:sqlite"
import { number, text, nullableText, type Row } from "../db/row.js"
import type { AgentsInterface } from "../interfaces/agents.interface.js"
import type { AgentModelInterface } from "../interfaces/agent-model.interface.js"
import { AgentModel } from "./agent-model.js"

export class Agents implements AgentsInterface {
  constructor(private readonly db: DatabaseSync) {}

  find(agentId: number): AgentModelInterface | undefined {
    const row = this.db.prepare("SELECT id, name, status, url FROM agents WHERE id = ?").get(agentId)
    return row ? this._model(row) : undefined
  }

  async list(): Promise<AgentModelInterface[]> {
    return this.db.prepare("SELECT id, name, status, url FROM agents ORDER BY id").all().map((row) => this._model(row))
  }

  async update(agentId: number, status: string): Promise<void> {
    const agent = this.find(agentId)
    if (!agent) throw new Error(`Agent ${agentId} was not found`)
    await agent.update(status)
  }

  private _model(row: Row): AgentModelInterface {
    return new AgentModel(this.db, {
      id: number(row, "id"), name: text(row, "name"), status: text(row, "status"), url: nullableText(row, "url"),
    })
  }
}
