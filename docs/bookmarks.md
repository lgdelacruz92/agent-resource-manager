# Resource Manager bookmark

Estimated reading time: 7 minutes (150 WPM)

## Current task

- All four model classes and interfaces now provide SQLite create, get, update, and delete methods. Ticket collections return model instances; ticket status validation includes `Flagged tickets`. Deleting agents and tickets is blocked when assignments reference them, and deleting assignments is blocked when executions reference them. Existing update calling patterns remain supported. Targeted model/collection typecheck and lint pass; full project typecheck is blocked by the existing syntax error in `assignment-reconciler.ts`. No tests or live database operations were run.

## Previous task: database diagram

- Documented all five tables in `shared-db/seed.sql` with a Mermaid ER diagram in `docs/data.md`, including columns, relationships, and the independent locks table. Verified against an in-memory seed; the diagram does not describe a verified live database. No live database was accessed or changed.

## Previous task: domain collection refactor

- Refactored the manager to inject SQLite-backed `Agents`, `Tickets`, `Assignments`, and `Executions`; individual agent, assignment, and execution models handle their own writes. The reconciler uses the existing assignment and its latest execution; the older broad database class is no longer wired into the manager.
- User chose manager-monitored executions, In progress when work is sent, direct Vikunja confirmation of Done before successful release, and Retry on failure. The manager retains reservations if safe completion cannot be established and coordinates completion under the scheduler lock.
- Lint, typecheck, and build pass. No tests were written or run, and no services or live database were started. The refactored flow, board pagination assumptions, and deployed API compatibility remain unverified; do not treat previous tests as coverage of the new implementation.
- A dummy implementation means empty methods or minimal type-compatible returns, without real behavior or state. The convention is recorded in `AGENTS.md`.
- Explained the `async` parsing error in `src/interfaces/agents-manager.interface.ts`: remove `async` from the interface declaration and keep the `Promise<Agent[]>` return type. No source changes requested.
- Explained `compilerOptions.types`: adding `node` includes Node globals from `@types/node`. This project already has that package and no explicit `types` list.
- Discussed TypeScript language support in VS Code and the distinction between its built-in TypeScript server and an LSP-compatible server. `typescript-language-server` was not found on PATH, in the project, or in global npm packages; other installations were not ruled out.
- Both `npm run dev` and `npm start` now load `.env.local` using `--env-file`. The manager was not started.

## Previous task: board-driven completion

- User chose no review stage in the manager: another app may handle review later. The refactored manager waits for an externally moved Done card after a successful execution; this behavior has not been verified against deployed services.
- Refactored `_reconcile` in `src/components/assignment-reconciler.ts` into shorter, descriptive private methods for starting, recovering, and monitoring work. Lint, typecheck, and all 57 tests passed.
- Discussed its flow: it reads the latest execution; most failures are finalized for scheduler retry, while a session missing before work was requested can lead to a new execution directly. A missing URL leaves the assignment reserved.
- User prefers short, readable functions whose names explain what they do.
- ESLint requires TypeScript private class methods to start with `_`. Use `npm run lint`.
- npm audit reports a moderate minimatch advisory in the linting dependencies; ESLint 10 does not support Node 23.

## Board-driven completion decisions and remaining risks

- In progress is recorded after the work request, with board movement and assignment update coordinated under the lock. Successful completion checks the live board rather than relying on the scheduler's copy.
- Anyone who can move a card to Done can affect completion; the manager does not verify a PR merge. It also requires the agent to be idle and not flagged for review before release.
- Failed executions take the Retry path, including when Done is also visible. Board/API failures or uncertain agent availability retain the reservation. If a card reaches Done before In progress is recorded, the manager will not move it back and keeps the assignment reserved for review. Pagination and races with human board edits still need real-world verification.

## Previous task: PR merge policy

- Earlier direction: keep the worker reserved while its PR awaits review or merge; session idleness does not mean the worker is available. The user now proposes the manager observe the ticket's Done column instead of managing review or checking how it was completed.
- For the proof of concept, a person manually gives the worker PR review feedback. Automation can be considered later if the concept is proven; it is deferred.
- [manual-done.md](../manual-done.md) describes the older manual procedure. The refactored manager now waits for an external Done move; its new behavior and this procedure have not been verified together.

## Previous task: first test run

- The latest discussion covered what remains before a first test run; no live run was started. The user previously chose to skip deployed API verification, not to treat it as completed.
- Before any requested run, check an isolated board and agent workspace, a prepared shared database, matching configuration, competing controllers, and monitoring. The prerequisites below remain reminders, not authorization to start services.

## Before real dispatch

- Verify the OpenCode session routes, response shapes, readiness timestamps, and Vikunja task and card operations against controlled deployments. The new flow has not been verified against deployed services.
- Fast tasks can be detected from a newer completed busy/idle interval compared with the pre-prompt baseline. If timestamps are absent or do not advance, the manager still cannot recognize a task missed between polls; it waits or reaches the configured timeout. Restart accepts recorded work with an idle, ready session as successful, per the agreed recovery rule.
- Decide an execution timeout value. `RESOURCE_MANAGER_EXECUTION_TIMEOUT_MS` is optional and has no default.
- Document human recovery steps for stale locks. The manager logs locks older than two minutes, but neither `resource-manager-pass` nor `ticket-scheduling` is cleared automatically after a crash.
- Check cross-controller coordination, actual shared database schema, agent provisioning, and monitoring before allowing real dispatch. Never run the seed or drop scripts on a user database without authorization.

## Verification already done

- The earlier implementation had controlled tests for startup, recovery, failures, and locking; those test files were removed and do not verify the refactored flow.
- The manager and scheduler have not been tested together against deployed OpenCode and Vikunja services.
