import { useState } from 'react'
import { supabase } from '../lib/supabase'
import styles from './AuthPage.module.css'

function AuthPage() {
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (!email || !password) return
    setLoading(true)
    setError(null)
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
      } else {
        setDone(true)
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('이메일 또는 비밀번호가 올바르지 않아요.')
      }
    }
    setLoading(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const switchMode = () => {
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
    setError(null)
  }

  if (done) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.logoWrap}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <path d="M16 4C12 4 8.5 6.3 6.7 9.7C7.4 9.5 8.2 9.4 9 9.4C14.5 9.4 19 13.9 19 19.4C19 22.8 17.2 25.8 14.5 27.6C14.9 27.7 15.5 27.8 16 27.8C22.6 27.8 28 22.4 28 15.8C28 9.2 22.6 4 16 4Z" fill="var(--color-accent)" opacity="0.8"/>
              <path d="M9 11C5.7 11 3 13.7 3 17C3 20.3 5.7 23 9 23C11 23 12.8 22 13.9 20.5C13.3 20.2 12.7 19.8 12.3 19.4C11.6 20.3 10.4 21 9 21C6.8 21 5 19.2 5 17C5 14.8 6.8 13 9 13C9.4 13 9.8 13.1 10.1 13.2C10 12.8 10 12.4 10 12C10 11.6 10 11.3 10.1 11C9.7 11 9.4 11 9 11Z" fill="var(--color-text-highlight)"/>
            </svg>
            <h1 className={styles.logo}>SleepLog</h1>
          </div>
          <div className={styles.doneBox}>
            <p className={styles.doneTitle}>이메일을 확인해주세요!</p>
            <p className={styles.doneHint}>
              <strong>{email}</strong>로 인증 링크를 보냈어요.{'\n'}
              링크를 클릭하면 로그인할 수 있어요.
            </p>
          </div>
          <button
            type="button"
            className={styles.submitBtn}
            onClick={() => { setDone(false); setMode('signin') }}
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <path d="M16 4C12 4 8.5 6.3 6.7 9.7C7.4 9.5 8.2 9.4 9 9.4C14.5 9.4 19 13.9 19 19.4C19 22.8 17.2 25.8 14.5 27.6C14.9 27.7 15.5 27.8 16 27.8C22.6 27.8 28 22.4 28 15.8C28 9.2 22.6 4 16 4Z" fill="var(--color-accent)" opacity="0.8"/>
            <path d="M9 11C5.7 11 3 13.7 3 17C3 20.3 5.7 23 9 23C11 23 12.8 22 13.9 20.5C13.3 20.2 12.7 19.8 12.3 19.4C11.6 20.3 10.4 21 9 21C6.8 21 5 19.2 5 17C5 14.8 6.8 13 9 13C9.4 13 9.8 13.1 10.1 13.2C10 12.8 10 12.4 10 12C10 11.6 10 11.3 10.1 11C9.7 11 9.4 11 9 11Z" fill="var(--color-text-highlight)"/>
          </svg>
          <h1 className={styles.logo}>SleepLog</h1>
          <p className={styles.logoSub}>
            {mode === 'signin' ? '다시 만나서 반가워요' : '수면 기록을 시작해보세요'}
          </p>
        </div>

        <div className={styles.fields}>
          <input
            type="email"
            className={styles.input}
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="email"
            autoCapitalize="none"
          />
          <input
            type="password"
            className={styles.input}
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <button
          type="button"
          className={styles.submitBtn}
          onClick={handleSubmit}
          disabled={loading || !email || !password}
        >
          {loading ? '처리 중...' : mode === 'signup' ? '회원가입' : '로그인'}
        </button>

        <p className={styles.toggle}>
          {mode === 'signin' ? '계정이 없나요?' : '이미 계정이 있나요?'}
          {' '}
          <button type="button" className={styles.toggleBtn} onClick={switchMode}>
            {mode === 'signin' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  )
}

export default AuthPage
