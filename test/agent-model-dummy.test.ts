import assert from "node:assert/strict"
import { test } from "node:test"
import { AgentModel } from "../src/components/agent-model.js"

test("dummy agent model has placeholder values and an empty update", async () => {
  const agent = new AgentModel()

  assert.deepEqual({ id: agent.id, name: agent.name, status: agent.status, url: agent.url }, {
    id: 0, name: "", status: "", url: null,
  })
  assert.equal(await agent.update("busy"), undefined)
  assert.equal(agent.status, "")
})
