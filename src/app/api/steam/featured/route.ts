import { NextResponse } from 'next/server'
import { fetchSteamFeatured } from '@/lib/steam'

/**
 * GET /api/steam/featured
 *
 * Proxies the Steam Featured Specials API and returns a clean,
 * typed list of currently discounted games.
 *
 * Caching: Next.js caches the underlying Steam fetch for 5 minutes
 * (configured via `next: { revalidate: 300 }` in the steam.ts helper).
 */
export async function GET() {
  try {
    const games = await fetchSteamFeatured()
    return NextResponse.json({ games })
  } catch (error) {
    console.error('[/api/steam/featured]', error)
    return NextResponse.json(
      { error: 'Failed to fetch Steam featured games.' },
      { status: 502 }
    )
  }
}
