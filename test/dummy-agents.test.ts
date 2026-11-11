import assert from "node:assert/strict"
import { test } from "node:test"
import { Agents } from "../src/components/agents.js"
import type { AgentModelInterface } from "../src/interfaces/agent-model.interface.js"

function agent(id: number, update: (status: string) => Promise<void>): AgentModelInterface {
  return { id, name: `agent ${id}`, status: "idle", url: null, update }
}

test("lists the supplied agent models", async () => {
  const models = [agent(1, async () => {}), agent(2, async () => {})]

  assert.deepEqual(await new Agents(models).list(), models)
  assert.deepEqual(await new Agents().list(), [])
})

test("updates only the agent with the matching ID", async () => {
  const updates: Array<[number, string]> = []
  const agents = new Agents([
    agent(1, async (status) => { updates.push([1, status]) }),
    agent(2, async (status) => { updates.push([2, status]) }),
  ])

  await agents.update(2, "busy")
  assert.deepEqual(updates, [[2, "busy"]])
})

test("rejects when no agent matches", async () => {
  const agents = new Agents([agent(1, async () => {})])

  await assert.rejects(agents.update(2, "busy"), /No agent found/)
})

test("waits for the agent model update to finish", async () => {
  let finishUpdate = () => {}
  const pending = new Promise<void>((resolve) => { finishUpdate = resolve })
  const agents = new Agents([agent(1, () => pending)])
  let completed = false
  const update = agents.update(1, "busy").then(() => { completed = true })

  try {
    await Promise.resolve()
    assert.equal(completed, false)
  } finally {
    finishUpdate()
    await update
  }
})

test("propagates errors from the agent model update", async () => {
  const error = new Error("update failed")
  const agents = new Agents([agent(1, () => {
    const rejected = Promise.reject(error)
    void rejected.catch(() => {})
    return rejected
  })])

  await assert.rejects(agents.update(1, "busy"), error)
})
