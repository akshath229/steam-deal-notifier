import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { WishlistItem } from '@/components/WishlistItem'
import Link from 'next/link'
import type { TrackedGameWithDetails } from '@/types/database'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'My Wishlist',
  description: 'Your tracked Steam games with custom price alerts.',
}

export default async function WishlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null // middleware redirects before this runs
  }

  const { data: items } = await supabase
    .from('user_tracked_games')
    .select(`
      id, profile_id, app_id, target_price_cents, notified_at, created_at,
      games ( app_id, title, header_image, base_price_cents, current_price_cents, discount_percent, is_aaa, last_updated_at )
    `)
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false })

  const tracked = (items as unknown as TrackedGameWithDetails[]) ?? []
  const hitCount = tracked.filter(
    (i) => i.games && i.games.current_price_cents > 0 && i.games.current_price_cents <= i.target_price_cents
  ).length

  return (
    <div className="page-wrapper">
      <div className={styles.header}>
        <div>
          <h1>⭐ My Wishlist</h1>
          <p className={styles.subtitle}>
            {tracked.length} game{tracked.length !== 1 ? 's' : ''} tracked
            {hitCount > 0 && (
              <span className={styles.hitAlert}> · {hitCount} at target!</span>
            )}
          </p>
        </div>
        <Link href="/search" className="btn btn-primary">
          + Add Game
        </Link>
      </div>

      {tracked.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">⭐</div>
          <h3>No games tracked yet</h3>
          <p>
            Head to the{' '}
            <Link href="/dashboard" style={{ color: 'var(--text-accent)' }}>
              Deal Dashboard
            </Link>{' '}
            or{' '}
            <Link href="/search" style={{ color: 'var(--text-accent)' }}>
              Search
            </Link>{' '}
            to start tracking games.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {tracked.map((item) => (
            item.games ? (
              <WishlistItem key={item.id} item={item} />
            ) : null
          ))}
        </div>
      )}
    </div>
  )
}
