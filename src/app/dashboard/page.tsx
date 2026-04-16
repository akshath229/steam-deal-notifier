import type { Metadata } from 'next'
import { fetchSteamFeatured } from '@/lib/steam'
import { DealCard } from '@/components/DealCard'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Deal Dashboard',
  description: 'Browse live Steam deals and discounts curated by Valve. Track games you want with a custom price alert.',
}

// Revalidate the page every 5 minutes (matching the Steam fetch cache)
export const revalidate = 300

export default async function DashboardPage() {
  let games = await fetchSteamFeatured().catch(() => [])
  const aaaCount = games.filter((g) => g.is_aaa).length

  // Sort: biggest discount first
  games = games.sort((a, b) => b.discount_percent - a.discount_percent)

  return (
    <div className="page-wrapper">
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>
            <span className={styles.fire}>🔥</span>{' '}
            Today&apos;s Steam Deals
          </h1>
          <p className={styles.heroSub}>
            Live, curated discounts from Steam. Track the ones you want and get Discord alerts the moment they hit your target price.
          </p>
        </div>

        <div className={styles.heroStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{games.length}</span>
            <span className={styles.statLabel}>Active Deals</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.stat}>
            <span className={styles.statValue}>{aaaCount}</span>
            <span className={styles.statLabel}>AAA Titles</span>
          </div>
          {games[0] && (
            <>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statValue}>{games[0].discount_percent}%</span>
                <span className={styles.statLabel}>Top Discount</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Deals Grid */}
      <div className="section-header">
        <div>
          <h2 className="section-title">Featured Specials</h2>
          <p className="section-subtitle">Updated every 5 minutes · Click any card to set a price alert</p>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">😴</div>
          <h3>No deals right now</h3>
          <p>Steam&apos;s featured deals are quiet. Check back soon!</p>
        </div>
      ) : (
        <div className="deals-grid">
          {games.map((game) => (
            <DealCard key={game.app_id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}
