import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase, fromDb } from '../lib/supabase'
import styles from './StatsPage.module.css'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDateStrOffset(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function calcDurationHours(bedTime, wakeTime) {
  const [bh, bm] = bedTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let bedMin = bh * 60 + bm
  let wakeMin = wh * 60 + wm
  if (wakeMin <= bedMin) wakeMin += 24 * 60
  return (wakeMin - bedMin) / 60
}

function avg(arr) {
  if (!arr.length) return null
  return arr.reduce((s, v) => s + v, 0) / arr.length
}

function fmtDate(dateStr) {
  const [, m, d] = dateStr.split('-')
  return `${m}/${d}`
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length || payload[0].value == null) return null
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{label}</span>
      <span className={styles.tooltipValue}>{payload[0].value}{unit}</span>
    </div>
  )
}

function StatsPage() {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('sleep_records')
      .select()
      .then(({ data }) => {
        if (data) setRecords(data.map(fromDb))
        setLoading(false)
      })
  }, [])

  const today = getTodayStr()

  if (loading) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>수면 통계</h1>
          <p className={styles.subtitle}>최근 30일</p>
        </header>
        <p className={styles.loadingText}>불러오는 중...</p>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>수면 통계</h1>
          <p className={styles.subtitle}>최근 30일</p>
        </header>
        <div className={styles.emptyCard}>
          <svg className={styles.emptyIcon} width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
            <circle cx="24" cy="24" r="20" stroke="var(--color-border)" strokeWidth="2" />
            <path d="M24 16C19.6 16 16 19.6 16 24C16 26.4 17 28.6 18.7 30.1" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 16C28.4 16 32 19.6 32 24C32 28.4 28.4 32 24 32" stroke="var(--color-border)" strokeWidth="2" strokeLinecap="round" />
            <path d="M24 20V25" stroke="var(--color-text-muted)" strokeWidth="2" strokeLinecap="round" />
            <circle cx="24" cy="28.5" r="1" fill="var(--color-text-muted)" />
          </svg>
          <p className={styles.emptyText}>아직 기록이 없어요</p>
          <p className={styles.emptyHint}>홈에서 수면을 기록해보세요</p>
        </div>
      </div>
    )
  }

  const cutoff30 = getDateStrOffset(29)
  const cutoff14 = getDateStrOffset(13)
  const records30 = records.filter((r) => r.date >= cutoff30 && r.date <= today)
  const records14 = records.filter((r) => r.date >= cutoff14 && r.date <= today)

  const durations30 = records30.map((r) => calcDurationHours(r.bedTime, r.wakeTime))
  const qualities30 = records30.filter((r) => r.quality > 0).map((r) => r.quality)
  const avgDuration = avg(durations30)
  const avgQuality = avg(qualities30)

  const last14 = Array.from({ length: 14 }, (_, i) => getDateStrOffset(13 - i))

  const durationChartData = last14.map((date) => {
    const rec = records14.find((r) => r.date === date)
    return {
      date: fmtDate(date),
      hours: rec
        ? parseFloat(calcDurationHours(rec.bedTime, rec.wakeTime).toFixed(1))
        : null,
    }
  })

  const qualityChartData = last14.map((date) => {
    const rec = records14.find((r) => r.date === date)
    return {
      date: fmtDate(date),
      score: rec && rec.quality > 0 ? rec.quality : null,
    }
  })

  const hasDurationData = durationChartData.some((d) => d.hours !== null)
  const hasQualityData = qualityChartData.some((d) => d.score !== null)

  const caffeineYes = records30.filter((r) => r.caffeine && r.quality > 0).map((r) => r.quality)
  const caffeineNo  = records30.filter((r) => !r.caffeine && r.quality > 0).map((r) => r.quality)
  const caffeineData =
    caffeineYes.length >= 2 && caffeineNo.length >= 2
      ? { yes: avg(caffeineYes), no: avg(caffeineNo) }
      : null

  const exerciseYes = records30.filter((r) => r.exercise).map((r) =>
    calcDurationHours(r.bedTime, r.wakeTime),
  )
  const exerciseNo = records30.filter((r) => !r.exercise).map((r) =>
    calcDurationHours(r.bedTime, r.wakeTime),
  )
  const exerciseData =
    exerciseYes.length >= 2 && exerciseNo.length >= 2
      ? { yes: avg(exerciseYes), no: avg(exerciseNo) }
      : null

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>수면 통계</h1>
        <p className={styles.subtitle}>최근 30일</p>
      </header>

      <div className={styles.summaryRow}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>평균 수면 시간</span>
          <span className={styles.summaryValue}>
            {avgDuration !== null ? `${avgDuration.toFixed(1)}h` : '—'}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>평균 수면 점수</span>
          <span className={styles.summaryValue}>
            {avgQuality !== null ? `${avgQuality.toFixed(1)} / 5` : '—'}
          </span>
        </div>
      </div>

      {hasDurationData && (
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>수면 시간 추이</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={durationChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#7B74B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 12]}
                ticks={[0, 4, 8, 12]}
                tickFormatter={(v) => `${v}h`}
                tick={{ fill: '#7B74B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip content={<ChartTooltip unit="h" />} />
              <Line
                type="monotone"
                dataKey="hours"
                stroke="#7F77DD"
                strokeWidth={2}
                dot={{ fill: '#AFA9EC', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#7F77DD', r: 5, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {hasQualityData && (
        <div className={styles.chartCard}>
          <p className={styles.chartTitle}>수면 점수 추이</p>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={qualityChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#7B74B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 5]}
                ticks={[0, 1, 2, 3, 4, 5]}
                tick={{ fill: '#7B74B8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={20}
              />
              <Tooltip content={<ChartTooltip unit="점" />} />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#AFA9EC"
                strokeWidth={2}
                dot={{ fill: '#7F77DD', r: 3, strokeWidth: 0 }}
                activeDot={{ fill: '#AFA9EC', r: 5, strokeWidth: 0 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className={styles.influenceCard}>
        <p className={styles.chartTitle}>카페인 & 운동 영향</p>
        {caffeineData && (
          <div className={styles.influenceRow}>
            <span className={styles.influenceLabel}>카페인</span>
            <span className={styles.influenceVal}>
              <span className={styles.influenceOn}>O: {caffeineData.yes.toFixed(1)}점</span>
              <span className={styles.influenceDivider}>/</span>
              <span className={styles.influenceOff}>X: {caffeineData.no.toFixed(1)}점</span>
            </span>
          </div>
        )}
        {exerciseData && (
          <div className={styles.influenceRow}>
            <span className={styles.influenceLabel}>운동</span>
            <span className={styles.influenceVal}>
              <span className={styles.influenceOn}>O: {exerciseData.yes.toFixed(1)}h</span>
              <span className={styles.influenceDivider}>/</span>
              <span className={styles.influenceOff}>X: {exerciseData.no.toFixed(1)}h</span>
            </span>
          </div>
        )}
        {!caffeineData && !exerciseData && (
          <p className={styles.influenceEmpty}>
            데이터가 더 쌓이면 분석할 수 있어요
          </p>
        )}
      </div>
    </div>
  )
}

export default StatsPage
