# Resource Manager bookmark

Estimated reading time: 8 minutes (150 WPM)

## Current task

- User is refactoring toward collection and model interfaces. Added `TicketModelInterface`, `TicketsInterface`, and `Tickets`, with a passing focused test; user asked to defer the `find` concern. `Tickets` is not wired into the reconciler. Full lint and typecheck fail on the existing in-progress reconciler refactor, including its missing database dependency and constructor wiring.
- `src/components/agent-model.ts` began as a dummy; the user has since added a database-backed `update`. Its fields still have placeholder defaults, and the earlier dummy-test and verification results predate that change.
- User is refactoring `src/components/agents.ts` around agent models. Updated `test/dummy-agents.test.ts` to test listing, targeted updates, missing IDs, and asynchronous model updates. Three tests pass and two fail: `Agents.update` neither waits for the model update nor propagates its rejection. Lint and source typecheck pass; implementation was left unchanged.
- A dummy implementation means empty methods or minimal type-compatible returns, without real behavior or state. The convention is recorded in `AGENTS.md`.
- Explained the `async` parsing error in `src/interfaces/agents-manager.interface.ts`: remove `async` from the interface declaration and keep the `Promise<Agent[]>` return type. No source changes requested.
- Explained `compilerOptions.types`: adding `node` includes Node globals from `@types/node`. This project already has that package and no explicit `types` list.
- Discussed TypeScript language support in VS Code and the distinction between its built-in TypeScript server and an LSP-compatible server. `typescript-language-server` was not found on PATH, in the project, or in global npm packages; other installations were not ruled out.
- Both `npm run dev` and `npm start` now load `.env.local` using `--env-file`. The manager was not started.

## Previous task: board-driven completion

- User proposes no review stage in the manager: another app may handle review later. The manager would use a ticket previously In progress and now in Vikunja Done as the assignment-completion signal. This is discussion only; trigger details, failure handling, and edge cases remain open.
- Refactored `_reconcile` in `src/components/assignment-reconciler.ts` into shorter, descriptive private methods for starting, recovering, and monitoring work. Lint, typecheck, and all 57 tests passed.
- Discussed its flow: it reads the latest execution; most failures are finalized for scheduler retry, while a session missing before work was requested can lead to a new execution directly. A missing URL leaves the assignment reserved.
- User prefers short, readable functions whose names explain what they do.
- ESLint requires TypeScript private class methods to start with `_`. Use `npm run lint`.
- npm audit reports a moderate minimatch advisory in the linting dependencies; ESLint 10 does not support Node 23.

## Resume: board-driven completion gaps

Discuss these before implementing the proposed Done signal:

1. **Missed In progress:** The manager currently records `in_progress` only after observing the agent busy. Fast work can finish between checks, so an assignment might never get that record. Decide when to record it.
2. **Manager currently moves Done:** An idle agent currently leads to a successful execution, a move to Done, and assignment completion. Change this flow so the manager does not trigger its own completion signal.
3. **Trust in Done:** Anyone able to move a card to Done could trigger completion, even by mistake or before a merge. Decide whether the board alone is authoritative.
4. **Failures and races:** Decide whether timeouts and unreachable agents still move tickets to Retry, and what wins if Done and a failure occur around the same time.
5. **Agent availability:** A ticket could be Done while its agent is busy or unreachable. Decide separately when to complete the assignment and when to make the agent available.
6. **Board freshness and outages:** The scheduler copies board status to the database; the manager does not directly check the current column. Decide how to obtain a trustworthy status and what happens when it is stale or unavailable.

**Next discussion:** Should an assignment count as In progress as soon as work is sent, even if the manager never sees the agent busy? Discuss one decision at a time. No implementation authorized yet.

## Previous task: PR merge policy

- Earlier direction: keep the worker reserved while its PR awaits review or merge; session idleness does not mean the worker is available. The user now proposes the manager observe the ticket's Done column instead of managing review or checking how it was completed.
- For the proof of concept, a person manually gives the worker PR review feedback. Automation can be considered later if the concept is proven; it is deferred.
- Created [manual-done.md](../manual-done.md) as a human procedure for moving the ticket to Done, completing the execution and assignment, and setting the agent idle after a merge. The scheduler requires both idle status and no incomplete assignment. Current manager behavior can release the worker before merge, so the procedure requires stopping it while waiting. PR tracking and other outcomes are not yet specified.

## Previous task: first test run

- The latest discussion covered what remains before a first test run; no live run was started. The user previously chose to skip deployed API verification, not to treat it as completed.
- Before any requested run, check an isolated board and agent workspace, a prepared shared database, matching configuration, competing controllers, and monitoring. The prerequisites below remain reminders, not authorization to start services.

## Before real dispatch

- Verify the OpenCode session routes, response shapes, readiness timestamps, and Vikunja task and card operations against controlled deployments. Tests currently use fakes, not deployed services.
- Fast tasks can be detected from a newer completed busy/idle interval compared with the pre-prompt baseline. If timestamps are absent or do not advance, the manager still cannot recognize a task missed between polls; it waits or reaches the configured timeout. Restart accepts recorded work with an idle, ready session as successful, per the agreed recovery rule.
- Decide an execution timeout value. `RESOURCE_MANAGER_EXECUTION_TIMEOUT_MS` is optional and has no default.
- Document human recovery steps for stale locks. The manager logs locks older than two minutes, but neither `resource-manager-pass` nor `ticket-scheduling` is cleared automatically after a crash.
- Check cross-controller coordination, actual shared database schema, agent provisioning, and monitoring before allowing real dispatch. Never run the seed or drop scripts on a user database without authorization.

## Verification already done

- Controlled tests cover fast-task timestamps, startup, recovery, missing sessions, uncertain prompts, failures, completion retries, lock contention, and the scheduler's retry limit against a shared in-memory database.
- The manager and scheduler have not been tested together against deployed OpenCode and Vikunja services.
