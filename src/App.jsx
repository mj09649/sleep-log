import { useState } from 'react'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import StatsPage from './pages/StatsPage'
import AiPage from './pages/AiPage'
import styles from './App.module.css'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />
      case 'stats':
        return <StatsPage />
      case 'ai':
        return <AiPage />
      default:
        return <HomePage />
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
