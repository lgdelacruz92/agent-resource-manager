import type { DatabaseSync } from "node:sqlite"
import type { LockData, LockModelInterface } from "../interfaces/lock-model.interface.js"
import { LockHeldError } from "./errors/lock-held-error.js";

export class LockModel implements LockModelInterface {
  readonly name: string
  readonly owner: string
  acquiredAt: string

  constructor(private readonly db: DatabaseSync, lock: LockModelInterface) {
    this.name = lock.name
    this.owner = lock.owner
    this.acquiredAt = lock.acquiredAt
  }

  async create(lock: LockData): Promise<LockModelInterface> {
    const result = this.db.prepare("INSERT INTO locks (name, owner, acquired_at) VALUES (?, ?, ?) ON CONFLICT(name) DO NOTHING")
      .run(lock.name, lock.owner, lock.acquiredAt)
    if (result.changes !== 1) throw new LockHeldError(lock.name)
    return this
  }

  async delete(lock: LockData): Promise<void> {
    const result = this.db.prepare("DELETE FROM locks WHERE name = ? AND owner = ?").run(lock.name, lock.owner)
    if (result.changes !== 1) throw new Error(`Could not release ${this.name} lock: owner does not match or lock is missing`)
  }
}
