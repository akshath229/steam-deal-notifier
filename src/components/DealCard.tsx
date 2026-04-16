'use client'

import { useState } from 'react'
import Image from 'next/image'
import { formatPrice, type SteamFeaturedGame } from '@/lib/steam'
import { TrackModal } from './TrackModal'
import styles from './DealCard.module.css'

interface DealCardProps {
  game: SteamFeaturedGame
}

export function DealCard({ game }: DealCardProps) {
  const [showModal, setShowModal] = useState(false)

  const steamUrl = `https://store.steampowered.com/app/${game.app_id}`

  return (
    <>
      <div className={`card ${styles.card}`}>
        {/* Game image */}
        <a
          href={steamUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.imageLink}
        >
          <div className={styles.imageWrapper}>
            <Image
              src={game.header_image}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 100vw, 300px"
              className={styles.image}
              unoptimized
            />
            {/* Discount badge */}
            {game.discount_percent > 0 && (
              <div className={styles.discountBadge}>
                -{game.discount_percent}%
              </div>
            )}
            {/* AAA badge */}
            {game.is_aaa && (
              <div className={styles.aaaBadge}>AAA</div>
            )}
          </div>
        </a>

        {/* Info */}
        <div className={styles.info}>
          <a
            href={steamUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.title}
          >
            {game.title}
          </a>

          <div className={styles.priceRow}>
            <div className={styles.prices}>
              {game.discount_percent > 0 && (
                <span className={styles.originalPrice}>
                  {formatPrice(game.base_price_cents)}
                </span>
              )}
              <span className={styles.currentPrice}>
                {formatPrice(game.current_price_cents)}
              </span>
            </div>

            <button
              className={`btn btn-primary btn-sm ${styles.trackBtn}`}
              onClick={() => setShowModal(true)}
              id={`track-btn-${game.app_id}`}
            >
              + Track
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <TrackModal
          game={game}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
