import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import AiPage from './pages/AiPage'
import AuthPage from './pages/AuthPage'
import styles from './App.module.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')
  const [session, setSession] = useState(undefined)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (session === undefined) return null

  if (!session) return <AuthPage />

  const renderPage = () => {
    switch (activeTab) {
      case 'home':  return <HomePage />
      case 'stats': return <StatsPage />
      case 'ai':    return <AiPage />
      default:      return <HomePage />
    }
  }

  return (
    <div className={styles.app}>
      <main className={styles.content}>
        {renderPage()}
      </main>
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default App
