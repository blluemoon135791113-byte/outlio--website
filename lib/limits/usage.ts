import 'server-only'

/**
 * Usage counters.
 *
 * Increments happen in the same transaction as the action they measure — see
 * `incrementUsage`, which uses an atomic upsert so two concurrent requests
 * cannot both slip under a limit.
 */
import { createAdminClient } from '@/lib/supabase/admin'
import type { UsageMetric } from '@/types/database'

export type UsagePeriod = { start: Date; end: Date }

/** Calendar month, UTC. */
export function currentMonthPeriod(now = new Date()): UsagePeriod {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { start, end }
}

/** Calendar day, UTC. */
export function currentDayPeriod(now = new Date()): UsagePeriod {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  )
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000)
  return { start, end }
}

export type UsageSnapshot = {
  extractionsToday: number
  extractionsThisMonth: number
  recordsThisMonth: number
  exportsThisMonth: number
  storageBytes: number
  monthPeriod: UsagePeriod
  dayPeriod: UsagePeriod
}

/**
 * Supabase surfaces upstream failures (Cloudflare 5xx, gateway timeouts) as an
 * error whose `message` is an entire HTML page. Embedding that in a thrown
 * Error dumps a wall of markup into logs and, if it ever reached a response,
 * would leak infrastructure detail. Always truncate to a single line.
 */
function concise(message: string): string {
  const firstLine = message.split('\n')[0]?.trim() ?? ''
  const stripped = firstLine.startsWith('<') ? 'upstream returned HTML' : firstLine
  return stripped.length > 120 ? `${stripped.slice(0, 120)}…` : stripped
}

async function readCounter(
  userId: string,
  metric: UsageMetric,
  periodStart: Date,
): Promise<number> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('usage_counters')
    .select('count')
    // Service role bypasses RLS — scoping by user_id here is mandatory.
    .eq('user_id', userId)
    .eq('metric', metric)
    .eq('period_start', periodStart.toISOString())
    .maybeSingle()

  if (error) {
    throw new Error(`readCounter(${metric}) failed: ${concise(error.message)}`)
  }
  return data?.count ?? 0
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const month = currentMonthPeriod()
  const day = currentDayPeriod()

  const [extractionsToday, extractionsThisMonth, recordsThisMonth, exportsThisMonth, storageBytes] =
    await Promise.all([
      readCounter(userId, 'extractions', day.start),
      readCounter(userId, 'extractions', month.start),
      readCounter(userId, 'records', month.start),
      readCounter(userId, 'exports', month.start),
      readCounter(userId, 'storage_bytes', month.start),
    ])

  return {
    extractionsToday,
    extractionsThisMonth,
    recordsThisMonth,
    exportsThisMonth,
    storageBytes,
    monthPeriod: month,
    dayPeriod: day,
  }
}

/**
 * Atomically add to a counter and return the new total.
 *
 * Uses an upsert against the unique index `(user_id, metric, period_start)` so
 * concurrent callers serialise on the row rather than read-modify-write racing.
 */
export async function incrementUsage(
  userId: string,
  metric: UsageMetric,
  period: UsagePeriod,
  by = 1,
): Promise<number> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('increment_usage', {
    p_user_id: userId,
    p_metric: metric,
    p_period_start: period.start.toISOString(),
    p_period_end: period.end.toISOString(),
    p_by: by,
  })

  if (error) throw new Error(`incrementUsage(${metric}) failed: ${error.message}`)
  return typeof data === 'number' ? data : 0
}
