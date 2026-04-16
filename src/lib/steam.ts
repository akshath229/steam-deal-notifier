import { STEAM_FEATURED_URL, STEAM_SEARCH_URL, AAA_PUBLISHERS, AAA_PRICE_THRESHOLD_CENTS } from '@/lib/constants'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SteamFeaturedGame {
  app_id: number
  title: string
  header_image: string
  base_price_cents: number
  current_price_cents: number
  discount_percent: number
  is_aaa: boolean
}

export interface SteamSearchResult {
  app_id: number
  title: string
  header_image: string
  base_price_cents: number
  current_price_cents: number
  discount_percent: number
}

export interface SteamAppDetails {
  app_id: number
  title: string
  header_image: string
  base_price_cents: number
  current_price_cents: number
  discount_percent: number
  publishers: string[]
  is_aaa: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determines if a game qualifies as AAA based on its original price
 * and/or publisher name matching against a known AAA publisher list.
 */
export function resolveIsAaa(basePriceCents: number, publishers: string[] = []): boolean {
  if (basePriceCents >= AAA_PRICE_THRESHOLD_CENTS) return true
  return publishers.some((p) => AAA_PUBLISHERS.has(p))
}

/**
 * Converts a Steam price integer (in paise) to a formatted INR string.
 * e.g. 4999 → "₹49.99"
 */
export function formatPrice(cents: number): string {
  if (cents === 0) return 'Free'
  return `₹${(cents / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/**
 * Sleep for a given number of milliseconds.
 * Used to stagger Steam API requests and avoid rate limiting.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Fetches the Steam Featured & Specials list.
 * Returns the "large_capsules" array from the featured endpoint.
 * This always contains curated, discounted games from Valve.
 * Uses Next.js fetch caching with a 5-minute revalidation window.
 */
export async function fetchSteamFeatured(): Promise<SteamFeaturedGame[]> {
  const res = await fetch(`${STEAM_FEATURED_URL}?cc=in&l=en`, {
    next: { revalidate: 300 }, // 5 minutes
  })

  if (!res.ok) throw new Error(`Steam featured fetch failed: ${res.status}`)

  const data = await res.json()

  // The featured API returns large_capsules + featured_win + featured_mac + featured_linux
  const items: unknown[] = [
    ...(data?.large_capsules ?? []),
    ...(data?.featured_win ?? []),
  ]

  // De-duplicate by app_id using a Map
  const seen = new Map<number, SteamFeaturedGame>()

  for (const item of items) {
    const i = item as Record<string, unknown>
    const appId = i.id as number
    if (!appId || seen.has(appId)) continue

    const baseCents   = (i.original_price as number) ?? (i.final_price as number) ?? 0
    const currentCents = i.final_price as number ?? 0
    const discount    = i.discount_percent as number ?? 0

    seen.set(appId, {
      app_id: appId,
      title: i.name as string,
      header_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      base_price_cents: baseCents,
      current_price_cents: currentCents,
      discount_percent: discount,
      is_aaa: resolveIsAaa(baseCents),
    })
  }

  // Only return games that are actually on sale
  return Array.from(seen.values()).filter((g) => g.discount_percent > 0)
}

/**
 * Searches the Steam catalog for games by query string.
 * Uses the Steam store's autocomplete suggest endpoint.
 */
export async function searchSteamGames(query: string): Promise<SteamSearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const url = new URL(STEAM_SEARCH_URL)
  url.searchParams.set('term', query.trim())
  url.searchParams.set('cc', 'in')
  url.searchParams.set('l', 'en')

  const res = await fetch(url.toString(), { cache: 'no-store' })
  if (!res.ok) return []

  const data = await res.json()
  // storesearch returns { total: number, items: [...] }
  const items: unknown[] = Array.isArray(data?.items) ? data.items : []

  return items.slice(0, 10).map((item) => {
    const i      = item as Record<string, unknown>
    const appId  = i.id as number
    const price  = i.price as Record<string, unknown> | undefined

    const baseCents    = (price?.initial as number) ?? 0
    const currentCents = (price?.final as number) ?? 0
    const discount     = (price?.discount_percent as number) ?? 0

    return {
      app_id: appId,
      title: i.name as string,
      header_image: `https://cdn.akamai.steamstatic.com/steam/apps/${appId}/header.jpg`,
      base_price_cents: baseCents,
      current_price_cents: currentCents,
      discount_percent: discount,
    }
  })
}

/**
 * Fetches detailed price information for a single Steam app.
 * Used by the CRON worker to update the games cache in Supabase.
 * 
 * NOTE: This function must be called with a delay between invocations
 * to respect Steam's rate limits (~200 requests per 5 minutes).
 */
export async function fetchSteamAppDetails(appId: number): Promise<SteamAppDetails | null> {
  const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=in&filters=basic,price_overview,publishers`

  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const data = await res.json()
    const game = data?.[String(appId)]

    if (!game?.success || !game?.data) return null

    const d          = game.data
    const priceOverview = d.price_overview
    const publishers    = (d.publishers as string[]) ?? []

    const baseCents    = priceOverview?.initial ?? 0
    const currentCents = priceOverview?.final ?? 0
    const discount     = priceOverview?.discount_percent ?? 0

    return {
      app_id: appId,
      title: d.name as string,
      header_image: d.header_image as string,
      base_price_cents: baseCents,
      current_price_cents: currentCents,
      discount_percent: discount,
      publishers,
      is_aaa: resolveIsAaa(baseCents, publishers),
    }
  } catch {
    return null
  }
}
