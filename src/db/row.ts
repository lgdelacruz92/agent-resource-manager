// Validate SQLite values before exposing them as domain models.
import type { SQLOutputValue } from "node:sqlite"

export type Row = Record<string, SQLOutputValue>

export function number(row: Row, key: string): number {
  const value = row[key]
  if (typeof value !== "number" || !Number.isSafeInteger(value)) throw new Error(`Invalid ${key} in shared database`)
  return value
}

export function text(row: Row, key: string): string {
  const value = row[key]
  if (typeof value !== "string") throw new Error(`Invalid ${key} in shared database`)
  return value
}

export function nullableText(row: Row, key: string): string | null {
  return row[key] === null ? null : text(row, key)
}
