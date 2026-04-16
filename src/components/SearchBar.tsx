'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import { formatPrice, type SteamSearchResult } from '@/lib/steam'
import { TrackModal } from './TrackModal'
import styles from './SearchBar.module.css'

export function SearchBar() {
  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<SteamSearchResult[]>([])
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState<SteamSearchResult | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([])
      return
    }
    setLoading(true)
    try {
      const res  = await fetch(`/api/steam/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults(data.results ?? [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  return (
    <div className={styles.wrapper}>
      {/* Search input */}
      <div className={styles.inputRow}>
        <div className={styles.searchIcon}>🔍</div>
        <input
          id="game-search-input"
          type="text"
          className={`input ${styles.input}`}
          placeholder="Search Steam catalog… e.g. Cyberpunk, Elden Ring"
          value={query}
          onChange={handleInput}
          autoComplete="off"
        />
        {loading && <div className={styles.spinner} />}
        {query && (
          <button
            className={`btn btn-ghost btn-sm ${styles.clearBtn}`}
            onClick={() => { setQuery(''); setResults([]) }}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((game) => (
            <div key={game.app_id} className={styles.resultItem}>
              <div className={styles.resultImage}>
                <Image
                  src={game.header_image}
                  alt={game.title}
                  fill
                  sizes="80px"
                  unoptimized
                  className={styles.img}
                />
              </div>
              <div className={styles.resultInfo}>
                <span className={styles.resultTitle}>{game.title}</span>
                <div className={styles.resultPrices}>
                  {game.discount_percent > 0 && (
                    <span className={styles.resultOriginal}>
                      {formatPrice(game.base_price_cents)}
                    </span>
                  )}
                  <span className={styles.resultCurrent}>
                    {formatPrice(game.current_price_cents)}
                  </span>
                  {game.discount_percent > 0 && (
                    <span className="badge badge-deal">-{game.discount_percent}%</span>
                  )}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setSelected(game)}
                id={`search-track-${game.app_id}`}
              >
                + Track
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {query.length >= 2 && !loading && results.length === 0 && (
        <div className={styles.noResults}>
          No games found for &quot;{query}&quot;
        </div>
      )}

      {/* Track modal */}
      {selected && (
        <TrackModal
          game={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
