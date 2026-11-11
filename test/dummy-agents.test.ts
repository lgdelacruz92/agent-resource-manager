import assert from "node:assert/strict"
import { test } from "node:test"
import { Agents } from "../src/components/agents.js"

test("dummy agents returns an empty list and accepts updates without storing them", async () => {
  const agents = new Agents([{ id: 1, name: "frontend", status: "idle", url: null }])

  assert.deepEqual(await agents.list(), [])
  assert.equal(await agents.update(1, "busy"), undefined)
  assert.deepEqual(await agents.list(), [])
})
