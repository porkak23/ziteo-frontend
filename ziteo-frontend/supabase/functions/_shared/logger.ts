// _shared/logger.ts — Structured JSON logger for Supabase Edge Functions.
// Output is one JSON object per line, compatible with Supabase log drain and
// any log aggregator that parses NDJSON.

export type LogLevel = 'info' | 'warn' | 'error'

export interface LogEntry {
  ts: string
  level: LogLevel
  action: string
  fn?: string
  [key: string]: unknown
}

export function log(
  level: LogLevel,
  action: string,
  context?: Record<string, unknown>,
): void {
  const entry: LogEntry = {
    ts: new Date().toISOString(),
    level,
    action,
    fn: Deno.env.get('FUNCTION_NAME') ?? 'unknown',
    ...context,
  }
  // Supabase log drains read from stdout regardless of the console method used.
  // Use console.error for level=error so the runtime also marks the invocation
  // as failed in the dashboard; use console.log for info/warn.
  if (level === 'error') {
    console.error(JSON.stringify(entry))
  } else {
    console.log(JSON.stringify(entry))
  }
}
