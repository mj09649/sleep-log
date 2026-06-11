import { useState, useEffect, useCallback } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, ResponsiveContainer,
} from 'recharts'
import SleepForm from '../components/SleepForm'
import { supabase, fromDb } from '../lib/supabase'
import styles from './HomePage.module.css'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getTodayKorean() {
  const d = new Date()
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

function getDateStrOffset(daysAgo) {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekdayLabel(dateStr) {
  const [y, m, day] = dateStr.split('-').map(Number)
  return WEEKDAYS[new Date(y, m - 1, day).getDay()]
}

function calcDurationHours(bedTime, wakeTime) {
  const [bh, bm] = bedTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let bedMin = bh * 60 + bm
  let wakeMin = wh * 60 + wm
  if (wakeMin <= bedMin) wakeMin += 24 * 60
  return (wakeMin - bedMin) / 60
}

function formatHours(h) {
  const hours = Math.floor(h)
  const mins = Math.round((h - hours) * 60)
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <span className={styles.tooltipLabel}>{label}요일</span>
      <span className={styles.tooltipValue}>{payload[0].value}h</span>
    </div>
  )
}

function HomePage() {
  const [showForm, setShowForm] = useState(false)
  const [records, setRecords] = useState([])
  const today = getTodayStr()

  const fetchRecords = useCallback(async () => {
    const { data } = await supabase.from('sleep_records').select()
    if (data) setRecords(data.map(fromDb))
  }, [])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  const handleFormSaved = async () => {
    await fetchRecords()
    setShowForm(false)
  }

  const last7Days = Array.from({ length: 7 }, (_, i) => getDateStrOffset(6 - i))

  const chartData = last7Days.map((date) => {
    const rec = records.find((r) => r.date === date)
    const hours = rec
      ? parseFloat(calcDurationHours(rec.bedTime, rec.wakeTime).toFixed(1))
      : 0
    return { label: getWeekdayLabel(date), hours, isToday: date === today }
  })

  const last7Records = last7Days
    .map((date) => records.find((r) => r.date === date))
    .filter(Boolean)

  const weekAvg =
    last7Records.length > 0
      ? (
          last7Records.reduce(
            (sum, r) => sum + calcDurationHours(r.bedTime, r.wakeTime),
            0,
          ) / last7Records.length
        ).toFixed(1)
      : null

  const recentRecord = records
    .filter((r) => r.date <= today)
    .sort((a, b) => b.date.localeCompare(a.date))[0]

  const lastDuration = recentRecord
    ? formatHours(calcDurationHours(recentRecord.bedTime, recentRecord.wakeTime))
    : null

  const hasToday = records.some((r) => r.date === today)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.appName}>SleepLog</h1>
        <p className={styles.date}>{getTodayKorean()}</p>
      </header>

      {showForm ? (
        <SleepForm onSaved={handleFormSaved} />
      ) : (
        <>
          <div className={styles.summaryRow}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>어젯밤</span>
              <span className={styles.summaryValue}>{lastDuration ?? '—'}</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>주간 평균</span>
              <span className={styles.summaryValue}>
                {weekAvg ? `${weekAvg}h` : '—'}
              </span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>수면 점수</span>
              <span className={styles.summaryValue}>
                {recentRecord ? `${recentRecord.quality} / 5` : '—'}
              </span>
            </div>
          </div>

          <div className={styles.chartCard}>
            <p className={styles.chartTitle}>주간 수면</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData} barCategoryGap="32%">
                <XAxis
                  dataKey="label"
                  tick={{ fill: '#7B74B8', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 12]}
                  ticks={[0, 3, 6, 9, 12]}
                  tickFormatter={(v) => `${v}h`}
                  tick={{ fill: '#7B74B8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip
                  content={<ChartTooltip />}
                  cursor={{ fill: 'rgba(127,119,221,0.07)' }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.isToday ? '#7F77DD' : '#2E2A5A'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button
            type="button"
            className={styles.recordBtn}
            onClick={() => setShowForm(true)}
          >
            {hasToday ? '오늘 기록 수정하기' : '오늘 수면 기록하기'}
          </button>
        </>
      )}
    </div>
  )
}

export default HomePage
