import { useState, useEffect } from 'react'
import { supabase, fromDb, toDb } from '../lib/supabase'
import styles from './SleepForm.module.css'

async function getCurrentUserId() {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id
}

function getTodayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function SleepForm({ onSaved }) {
  const today = getTodayStr()

  const [bedTime, setBedTime] = useState('23:00')
  const [wakeTime, setWakeTime] = useState('07:00')
  const [quality, setQuality] = useState(0)
  const [hoveredStar, setHoveredStar] = useState(0)
  const [caffeine, setCaffeine] = useState(false)
  const [exercise, setExercise] = useState(false)
  const [memo, setMemo] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase
      .from('sleep_records')
      .select()
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return
        const rec = fromDb(data)
        setBedTime(rec.bedTime)
        setWakeTime(rec.wakeTime)
        setQuality(rec.quality)
        setCaffeine(rec.caffeine)
        setExercise(rec.exercise)
        setMemo(rec.memo)
      })
  }, [today])

  const handleSave = async () => {
    setSaving(true)
    const userId = await getCurrentUserId()
    await supabase
      .from('sleep_records')
      .upsert(
        { ...toDb({ date: today, bedTime, wakeTime, quality, caffeine, exercise, memo }), user_id: userId },
        { onConflict: 'user_id,date' },
      )
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onSaved?.()
    }, 1500)
  }

  const starActive = (star) =>
    hoveredStar > 0 ? hoveredStar >= star : quality >= star

  return (
    <div className={styles.form}>
      <div className={styles.card}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>취침 시간</label>
            <input
              type="time"
              className={styles.input}
              value={bedTime}
              onChange={(e) => setBedTime(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>기상 시간</label>
            <input
              type="time"
              className={styles.input}
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>수면 질</label>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`${styles.star}${starActive(star) ? ` ${styles.starActive}` : ''}`}
                onClick={() => setQuality((q) => (q === star ? 0 : star))}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                aria-label={`${star}점`}
              >
                ★
              </button>
            ))}
            {quality > 0 && (
              <span className={styles.qualityLabel}>{quality}점</span>
            )}
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>카페인 / 운동</label>
          <div className={styles.chips}>
            <button
              type="button"
              className={`${styles.chip}${caffeine ? ` ${styles.chipActive}` : ''}`}
              onClick={() => setCaffeine((v) => !v)}
            >
              카페인
            </button>
            <button
              type="button"
              className={`${styles.chip}${exercise ? ` ${styles.chipActive}` : ''}`}
              onClick={() => setExercise((v) => !v)}
            >
              운동
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>메모</label>
          <textarea
            className={styles.textarea}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="오늘 수면 특이사항..."
            rows={3}
          />
        </div>
      </div>

      <button
        type="button"
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? '저장 중...' : '저장하기'}
      </button>

      {saved && <p className={styles.savedMsg}>저장됐어요!</p>}
    </div>
  )
}

export default SleepForm
