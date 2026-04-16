import { NextResponse, type NextRequest } from 'next/server'
import { searchSteamGames } from '@/lib/steam'

/**
 * GET /api/steam/search?q=<query>
 *
 * Proxies the Steam store autocomplete search endpoint.
 * Returns up to 10 matching games with price data.
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q') ?? ''

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchSteamGames(query)
    return NextResponse.json({ results })
  } catch (error) {
    console.error('[/api/steam/search]', error)
    return NextResponse.json(
      { error: 'Steam search failed.' },
      { status: 502 }
    )
  }
}
