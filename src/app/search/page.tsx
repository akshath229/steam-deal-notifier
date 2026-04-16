import type { Metadata } from 'next'
import { SearchBar } from '@/components/SearchBar'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Search Games',
  description: 'Search the entire Steam catalog and add games to your wishlist with custom price alerts.',
}

export default function SearchPage() {
  return (
    <div className="page-wrapper">
      <div className={styles.header}>
        <h1>🔍 Search Steam Catalog</h1>
        <p className={styles.subtitle}>
          Find any game on Steam and set a price alert for it.
        </p>
      </div>

      <SearchBar />

      <div className={styles.tips}>
        <div className={styles.tip}>
          <span className={styles.tipIcon}>💡</span>
          <p>Type at least 2 characters to start searching. Results appear live as you type.</p>
        </div>
        <div className={styles.tip}>
          <span className={styles.tipIcon}>⭐</span>
          <p>Click <strong>+ Track</strong> on any result to set your target price and get notified on Discord.</p>
        </div>
      </div>
    </div>
  )
}
