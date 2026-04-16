'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import type { TrackedGameWithDetails } from '@/types/database'
import { formatPrice } from '@/lib/steam'
import styles from './WishlistItem.module.css'

interface WishlistItemProps {
  item: TrackedGameWithDetails
}

export function WishlistItem({ item }: WishlistItemProps) {
  const router  = useRouter()
  const game    = item.games
  const [removing, setRemoving] = useState(false)

  const currentPrice = game.current_price_cents
  const targetPrice  = item.target_price_cents
  const isPriceHit   = currentPrice > 0 && currentPrice <= targetPrice
  const steamUrl     = `https://store.steampowered.com/app/${game.app_id}`

  async function handleRemove() {
    setRemoving(true)
    const res = await fetch(`/api/track?id=${item.id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      setRemoving(false)
    }
  }

  return (
    <div className={`card ${styles.item} ${isPriceHit ? styles.priceHit : ''}`}>
      {/* Game image */}
      <a href={steamUrl} target="_blank" rel="noopener noreferrer" className={styles.imageLink}>
        <div className={styles.imageWrapper}>
          <Image
            src={game.header_image ?? `https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`}
            alt={game.title}
            fill
            sizes="120px"
            className={styles.image}
            unoptimized
          />
        </div>
      </a>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.top}>
          <a href={steamUrl} target="_blank" rel="noopener noreferrer" className={styles.title}>
            {game.title}
          </a>
          <div className={styles.badges}>
            {game.discount_percent > 0 && (
              <span className="badge badge-deal">-{game.discount_percent}%</span>
            )}
            {game.is_aaa && (
              <span className="badge badge-aaa">AAA</span>
            )}
            {isPriceHit && (
              <span className={styles.hitBadge}>🎯 Target Hit!</span>
            )}
          </div>
        </div>

        <div className={styles.prices}>
          <div className={styles.priceGroup}>
            <span className={styles.label}>Current</span>
            <span className={`${styles.price} ${isPriceHit ? styles.hitPrice : ''}`}>
              {formatPrice(currentPrice)}
            </span>
          </div>
          <div className={styles.divider} />
          <div className={styles.priceGroup}>
            <span className={styles.label}>Your Target</span>
            <span className={styles.target}>{formatPrice(targetPrice)}</span>
          </div>
          <div className={styles.divider} />
          <div className={styles.priceGroup}>
            <span className={styles.label}>Original</span>
            <span className={styles.original}>{formatPrice(game.base_price_cents)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <a
          href={steamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          View
        </a>
        <button
          className="btn btn-danger btn-sm"
          onClick={handleRemove}
          disabled={removing}
          id={`remove-btn-${item.id}`}
        >
          {removing ? '…' : 'Remove'}
        </button>
      </div>
    </div>
  )
}
