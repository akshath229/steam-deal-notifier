'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrice, type SteamFeaturedGame, type SteamSearchResult } from '@/lib/steam'
import styles from './TrackModal.module.css'

type GameInput = SteamFeaturedGame | SteamSearchResult

interface TrackModalProps {
  game: GameInput
  onClose: () => void
}

export function TrackModal({ game, onClose }: TrackModalProps) {
  const router = useRouter()

  // Default target: 20% below current price (rounded to nearest dollar)
  const defaultTarget = game.current_price_cents > 0
    ? Math.round(game.current_price_cents * 0.8 / 100).toString()
    : '0'

  const [targetDollars, setTargetDollars] = useState(defaultTarget)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const targetCents = Math.round(parseFloat(targetDollars) * 100)

    if (isNaN(targetCents) || targetCents < 0) {
      setError('Please enter a valid target price.')
      setLoading(false)
      return
    }

    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id:               game.app_id,
        title:                game.title,
        header_image:         game.header_image,
        base_price_cents:     game.base_price_cents,
        current_price_cents:  game.current_price_cents,
        discount_percent:     game.discount_percent,
        target_price_cents:   targetCents,
      }),
    })

    if (res.status === 401) {
      // Not logged in — redirect to login
      router.push('/auth/login?redirectTo=/dashboard')
      return
    }

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      onClose()
      router.refresh()
    }, 1200)
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className={styles.successState}>
            <div className={styles.successIcon}>✓</div>
            <h3>Tracking added!</h3>
            <p>We&apos;ll notify you when {game.title} drops below your target.</p>
          </div>
        ) : (
          <>
            <div className={styles.header}>
              <h3 className={styles.title}>Set Price Alert</h3>
              <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
            </div>

            <div className={styles.gameInfo}>
              <span className={styles.gameName}>{game.title}</span>
              <span className={styles.currentPrice}>
                Current: {formatPrice(game.current_price_cents)}
              </span>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="target-price" className={styles.label}>
                  Alert me when price drops to
                </label>
                <div className={styles.inputWrapper}>
                  <span className={styles.currency}>₹</span>
                  <input
                    id="target-price"
                    type="number"
                    step="0.01"
                    min="0"
                    className={`input ${styles.priceInput}`}
                    value={targetDollars}
                    onChange={(e) => setTargetDollars(e.target.value)}
                    placeholder="e.g. 19.99"
                    required
                  />
                </div>
                <p className={styles.hint}>
                  You&apos;ll get a Discord alert the moment the price hits this threshold.
                </p>
              </div>

              {error && (
                <div className={styles.error}>{error}</div>
              )}

              <div className={styles.actions}>
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  id="track-confirm-btn"
                  disabled={loading}
                >
                  {loading ? 'Saving…' : '⭐ Track Game'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
