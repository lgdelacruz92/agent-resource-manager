# Agent resource manager

Estimated reading time: 5 minutes (150 WPM)

This app checks registered agents and reconciles Ticket Scheduler assignments. Domain collections and models access SQLite; the reconciler coordinates OpenCode and Vikunja. The refactored flow has not been verified against deployed APIs or a live board.

## Run

Requires Node.js 22.13 or newer.
ESLint supports Node.js 22.13–22.x or 24 and newer; it does not support Node.js 23.

```sh
npm install
npm run dev
```

**Starting the app can dispatch real work, change agent status, and move Vikunja cards.** It checks every 30 seconds by default; `RESOURCE_MANAGER_POLL_MS` changes the interval. Stop it with Ctrl+C. To run the compiled app, use `npm run build` followed by `npm start`. Both run commands load `.env.local`.

Run `npm run lint` and `npm run typecheck` to check the TypeScript source. The previous test files have been removed; no tests were added for this refactor.

The default database resolves to `../shared-db/db.sqlite` relative to this project. `RESOURCE_MANAGER_DB_PATH` overrides it; verify that the manager and scheduler point to the same prepared database.

Set `VIKUNJA_URL`, `VIKUNJA_API_TOKEN`, `VIKUNJA_PROJECT_ID`, and `VIKUNJA_VIEW_ID` to the same board as the scheduler. Set `OPENCODE_SERVER_PASSWORD` and, if needed, `OPENCODE_SERVER_USERNAME` for Basic authentication; the username defaults to `opencode`. These credentials are used for every registered server. A human must prepare the shared database and its agent rows first; see [setup](docs/setup.md).

`RESOURCE_MANAGER_EXECUTION_TIMEOUT_MS` optionally sets a positive execution timeout in milliseconds. No timeout is enabled by default; its value remains a human decision. Each task-fetch failure is logged to the terminal; no separate alert is needed for this prototype.

Current activity comes from OpenCode's `/api/session/active`, which lists foreground sessions owned by that server process. Historical busy and idle timestamps are kept for detecting work completed between polls. If the active-session response is unavailable or invalid, the manager does not infer that the agent is idle.

After recording a work request, the manager moves the ticket to In progress and records that state on the assignment. If the shared lock is unavailable or the board move fails, it keeps the assignment reserved and retries. It monitors the execution and, after success, keeps the assignment reserved until the ticket is confirmed in Done directly on Vikunja and the agent is idle. A failed execution moves the ticket to Retry and completes the assignment under the scheduler lock; uncertain agent state keeps the reservation.

An unreachable agent or timed-out execution sets `needs_review`. An `unknown` result or missing URL leaves the existing status unchanged, so the Ticket Scheduler may still select an agent whose stored status is `idle`. A recovered agent is not automatically cleared from `needs_review`.

The `resource-manager-pass` lock prevents simultaneous manager passes. A crash can leave this lock or `ticket-scheduling` behind; neither is automatically cleared. The manager logs a warning when either lock is held for more than two minutes or has an invalid timestamp. A person must investigate before recovery. Before sending a prompt, the manager records the session's busy timestamp in memory. It can recognize a fast task from a newer completed busy/idle interval even if both events occur between polls. If timestamps are absent or do not advance, it waits for a confirmed busy state or the configured timeout. On restart, the agreed recovery rule accepts a recorded request whose session is idle and ready as successful.

For the shared database prerequisite, see [setup](docs/setup.md).

**Start here:** read the [data design](docs/data.md) and [session context](docs/session-context.md) for the agreed directions and remaining work. The scheduler's [shared data reference](../main/agent-team/apps/scheduler/docs/shared-data.md) is an older description; check the scheduler source before relying on it.

These notes are not authorization to start agents or modify infrastructure.

For session decisions and current progress, read [session context](docs/session-context.md).

For the initial direction, see the [proposed flowchart](docs/flowchart.md) and [build proposal](docs/proposal.md).
