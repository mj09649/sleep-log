import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export function fromDb(row) {
  return {
    date: row.date,
    bedTime: row.bed_time,
    wakeTime: row.wake_time,
    quality: row.quality,
    caffeine: row.caffeine,
    exercise: row.exercise,
    memo: row.memo,
  }
}

export function toDb(record) {
  return {
    date: record.date,
    bed_time: record.bedTime,
    wake_time: record.wakeTime,
    quality: record.quality,
    caffeine: record.caffeine,
    exercise: record.exercise,
    memo: record.memo,
  }
}
