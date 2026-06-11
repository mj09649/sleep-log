import { useState } from 'react'
import styles from './AiPage.module.css'

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

function loadRecords() {
  try {
    return JSON.parse(localStorage.getItem('sleeplog_records') || '[]')
  } catch {
    return []
  }
}

function buildPrompt(records) {
  const today = getTodayStr()
  const cutoff = getDateStrOffset(13)
  const recent = records
    .filter((r) => r.date >= cutoff && r.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date))
  if (recent.length === 0) return null
  const rows = recent
    .map((r) => {
      const hours = calcDurationHours(r.bedTime, r.wakeTime).toFixed(1)
      return `${r.date} | ${r.bedTime} | ${r.wakeTime} | ${hours}h | ${r.quality}/5 | ${r.caffeine ? 'O' : 'X'} | ${r.exercise ? 'O' : 'X'}`
    })
    .join('\n')
  return `아래는 내 최근 14일간의 수면 기록이야. 패턴을 분석하고 수면의 질을 높이기 위한 구체적인 조언을 한국어로 해줘.

[날짜] | 취침 | 기상 | 수면시간 | 점수 | 카페인 | 운동
${rows}

다음 3가지를 분석해줘:
1. 수면 패턴 요약 (취침/기상 시간 규칙성, 평균 수면 시간)
2. 문제점 및 개선이 필요한 부분
3. 이번 주 실천할 수 있는 구체적인 루틴 2~3가지`
}

function AiPage() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState('')
  const [error, setError] = useState(null)

  const records = loadRecords()
  const today = getTodayStr()
  const cutoff = getDateStrOffset(13)
  const hasRecords = records.some((r) => r.date >= cutoff && r.date <= today)

  const handleAnalyze = async () => {
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
    if (!apiKey) {
      setError('.env 파일에 VITE_ANTHROPIC_API_KEY를 설정해주세요.')
      setStatus('error')
      return
    }

    const prompt = buildPrompt(records)
    if (!prompt) return

    setStatus('loading')
    setResult('')
    setError(null)

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-beta': 'interleaved-thinking-2025-05-14',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          stream: true,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message || `서버 오류 (${response.status})`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))
        for (const line of lines) {
          let data
          try {
            data = JSON.parse(line.slice(6))
          } catch {
            continue
          }
          if (data.type === 'error') {
            throw new Error(data.error?.message || '스트리밍 오류가 발생했습니다.')
          }
          if (data.type === 'content_block_delta' && data.delta?.text) {
            setResult((prev) => prev + data.delta.text)
          }
        }
      }

      setStatus('done')
    } catch (err) {
      setError(err.message || '네트워크 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.iconWrap}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path
              d="M10 2L11.54 7H17L12.74 9.96L14.28 15L10 12.04L5.72 15L7.26 9.96L3 7H8.46L10 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
        <div>
          <h1 className={styles.title}>AI 수면 분석</h1>
          <p className={styles.subtitle}>최근 14일 기록 기반</p>
        </div>
      </header>

      {!hasRecords ? (
        <div className={styles.emptyCard}>
          <p className={styles.emptyText}>최근 14일간 수면 기록이 없어요.</p>
          <p className={styles.emptyHint}>
            홈에서 수면을 기록하면 AI가 패턴을 분석해드려요.
          </p>
        </div>
      ) : (
        <>
          {status === 'error' && <p className={styles.errorMsg}>{error}</p>}

          {(result || status === 'loading') && (
            <div className={styles.resultCard}>
              <p className={styles.resultText}>
                {result}
                {status === 'loading' && (
                  <span className={styles.cursor}>▍</span>
                )}
              </p>
            </div>
          )}

          <button
            type="button"
            className={styles.analyzeBtn}
            onClick={handleAnalyze}
            disabled={status === 'loading'}
          >
            {status === 'loading'
              ? '분석 중...'
              : status === 'done'
              ? '다시 분석하기'
              : '분석 요청하기'}
          </button>
        </>
      )}
    </div>
  )
}

export default AiPage
