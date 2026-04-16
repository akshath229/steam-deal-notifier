import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/track
 *
 * Body: { app_id: number, title: string, header_image: string,
 *         base_price_cents: number, current_price_cents: number,
 *         discount_percent: number, target_price_cents: number }
 *
 * Adds a game to the user's wishlist:
 * 1. Upserts the game into the shared `games` cache table.
 * 2. Inserts a row into `user_tracked_games` with the user's target price.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const {
    app_id,
    title,
    header_image,
    base_price_cents,
    current_price_cents,
    discount_percent,
    target_price_cents,
  } = body

  if (!app_id || !title || target_price_cents == null) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // 1. Upsert the game metadata into the shared cache
  const { error: gameError } = await supabase
    .from('games')
    .upsert(
      {
        app_id,
        title,
        header_image,
        base_price_cents: base_price_cents ?? 0,
        current_price_cents: current_price_cents ?? 0,
        discount_percent: discount_percent ?? 0,
      },
      { onConflict: 'app_id', ignoreDuplicates: false }
    )

  if (gameError) {
    console.error('[/api/track POST] game upsert error:', gameError)
    return NextResponse.json({ error: 'Failed to cache game data.' }, { status: 500 })
  }

  // 2. Insert the tracking rule for this user
  const { error: trackError } = await supabase
    .from('user_tracked_games')
    .upsert(
      {
        profile_id: user.id,
        app_id,
        target_price_cents,
      },
      { onConflict: 'profile_id,app_id', ignoreDuplicates: false }
    )

  if (trackError) {
    console.error('[/api/track POST] track upsert error:', trackError)
    return NextResponse.json({ error: 'Failed to save tracking rule.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

/**
 * DELETE /api/track?id=<uuid>
 *
 * Removes a tracked game by its `user_tracked_games.id`.
 * RLS ensures users can only delete their own rows.
 */
export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter.' }, { status: 400 })
  }

  const { error } = await supabase
    .from('user_tracked_games')
    .delete()
    .eq('id', id)
    .eq('profile_id', user.id)

  if (error) {
    console.error('[/api/track DELETE]', error)
    return NextResponse.json({ error: 'Failed to remove tracked game.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
