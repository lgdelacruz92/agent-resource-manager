export class LockHeldError extends Error {
  readonly status = 1

  constructor(lockName: string) {
    super(`${lockName} is already acquired`)
    this.name = "LockHeldError"
  }
}
