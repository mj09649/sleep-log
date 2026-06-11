import styles from './BottomNav.module.css'

const tabs = [
  {
    id: 'home',
    label: '홈',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    id: 'stats',
    label: '통계',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="12" width="4" height="9" rx="1" />
        <rect x="10" y="7" width="4" height="14" rx="1" />
        <rect x="17" y="3" width="4" height="18" rx="1" />
      </svg>
    ),
  },
  {
    id: 'ai',
    label: 'AI 분석',
    icon: (
      <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6L15 21H9l-.7-6A7 7 0 0 1 12 2z" />
        <path d="M9 21h6" />
        <path d="M12 7v4M10 9h4" />
      </svg>
    ),
  },
]

function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`${styles.tab}${activeTab === tab.id ? ` ${styles.active}` : ''}`}
          onClick={() => onTabChange(tab.id)}
          aria-label={tab.label}
        >
          {tab.icon}
          <span className={styles.label}>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
