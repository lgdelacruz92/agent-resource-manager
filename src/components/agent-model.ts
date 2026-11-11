import type { DatabaseSync } from "node:sqlite"
import type { AgentData, AgentModelInterface } from "../interfaces/agent-model.interface.js"
import { number, text, nullableText } from "../db/row.js"

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

  async get(): Promise<AgentData | null> {
    const row = this.db.prepare("SELECT id, name, status, url FROM agents WHERE id = ?").get(this.id)
    if (!row) return null
    return {
      id: number(row, "id"), name: text(row, "name"), status: text(row, "status"), url: nullableText(row, "url"),
    }
  }

  async create(): Promise<AgentModelInterface> {
    const result = this.db.prepare("INSERT INTO agents (name, status, url) VALUES (?, ?, ?)")
      .run(this.name, this.status, this.url)
    const id = Number(result.lastInsertRowid)
    if (!Number.isSafeInteger(id)) throw new Error("Created agent ID is not a safe integer")
    this.id = id
    return this
  }

  async update(agent: string | AgentData): Promise<void> {
    if (typeof agent !== "string" && agent.id !== this.id) throw new Error("Cannot update a different agent")
    const result = typeof agent === "string"
      ? this.db.prepare("UPDATE agents SET status = ? WHERE id = ?").run(agent, this.id)
      : this.db.prepare("UPDATE agents SET name = ?, status = ?, url = ? WHERE id = ?")
        .run(agent.name, agent.status, agent.url, this.id)
    if (result.changes !== 1) {
      throw new Error(`Agent ${this.id} was not found`)
    }
    if (typeof agent === "string") {
      this.status = agent
    } else {
      this.name = agent.name
      this.status = agent.status
      this.url = agent.url
    }
  }

  async delete(): Promise<void> {
    const result = this.db.prepare(`
      DELETE FROM agents WHERE id = ?
        AND NOT EXISTS (SELECT 1 FROM assignments WHERE agent_id = ?)
    `).run(this.id, this.id)
    if (result.changes !== 1) throw new Error(`Agent ${this.id} was not found or has assignments`)
  }
}
