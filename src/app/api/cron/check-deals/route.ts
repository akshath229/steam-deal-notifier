import { NextResponse, type NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { fetchSteamAppDetails, sleep } from '@/lib/steam'
import { CRON_BATCH_SIZE, STEAM_REQUEST_DELAY_MS } from '@/lib/constants'
import type { Profile, UserTrackedGame, Game } from '@/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

type CronAlertRow = {
  id: string
  profile_id: string
  app_id: number
  target_price_cents: number
  notified_at: string | null
  games: Game | null
  profiles: Profile | null
}

// ─── Discord Notification ─────────────────────────────────────────────────────

async function sendDiscordAlert(
  webhookUrl: string,
  game: Game,
  targetPriceCents: number
) {
  const currentPrice = game.current_price_cents === 0
    ? 'Free'
    : `$${(game.current_price_cents / 100).toFixed(2)}`

  const targetPrice = `$${(targetPriceCents / 100).toFixed(2)}`
  const discountBadge = game.discount_percent > 0 ? `🔥 **-${game.discount_percent}% OFF**` : ''
  const steamUrl = `https://store.steampowered.com/app/${game.app_id}`

  const embed = {
    embeds: [
      {
        title: `🎮 Deal Alert: ${game.title}`,
        url: steamUrl,
        color: 0x7c5cfc, // Violet accent
        description: `A game on your wishlist has dropped to or below your target price!\n\n${discountBadge}`,
        thumbnail: {
          url: game.header_image ?? `https://cdn.akamai.steamstatic.com/steam/apps/${game.app_id}/header.jpg`,
        },
        fields: [
          {
            name: '💰 Current Price',
            value: currentPrice,
            inline: true,
          },
          {
            name: '🎯 Your Target',
            value: targetPrice,
            inline: true,
          },
          {
            name: '🏷️ Original Price',
            value: game.base_price_cents === 0
              ? 'Free'
              : `$${(game.base_price_cents / 100).toFixed(2)}`,
            inline: true,
          },
        ],
        footer: {
          text: 'Steam Deal Tracker • Powered by Steam Web API',
        },
        timestamp: new Date().toISOString(),
      },
    ],
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(embed),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Discord webhook failed (${res.status}): ${text}`)
  }
}

// ─── CRON Route ───────────────────────────────────────────────────────────────

/**
 * GET /api/cron/check-deals
 *
 * CRON worker — triggered by Vercel Cron every 15 minutes.
 *
 * Flow:
 * 1. Authenticate via CRON_SECRET bearer token.
 * 2. Fetch the oldest N tracked app_ids (CRON_BATCH_SIZE = 30).
 * 3. For each app_id: call Steam appdetails API → upsert into `games`.
 * 4. After all fetches: check alert conditions and send Discord notifications.
 * 5. Mark notified rows so duplicate alerts aren't sent.
 * 6. Return a JSON summary.
 */
export async function GET(request: NextRequest) {
  // ── 1. Authenticate ──────────────────────────────────────────────────────
  const authHeader = request.headers.get('authorization')
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`

  // Allow localhost bypasses for local development
  const isLocalhost = request.nextUrl.hostname === 'localhost' ||
    request.nextUrl.hostname === '127.0.0.1'

  if (!isLocalhost && authHeader !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const stats = { processed: 0, updated: 0, alerts_sent: 0, errors: [] as string[] }

  // ── 2. Get unique app_ids to refresh (oldest first) ──────────────────────
  const { data: trackedRows, error: fetchError } = await supabase
    .from('user_tracked_games')
    .select('app_id')

  if (fetchError) {
    console.error('[CRON] Failed to fetch tracked games:', fetchError)
    return NextResponse.json({ error: 'DB fetch failed' }, { status: 500 })
  }

  // De-duplicate app_ids
  const uniqueAppIds = [...new Set((trackedRows as Pick<UserTrackedGame, 'app_id'>[])
    .map((r) => r.app_id))]

  // Get the stalest games first
  const { data: gameCache } = await supabase
    .from('games')
    .select('app_id, last_updated_at')
    .in('app_id', uniqueAppIds)
    .order('last_updated_at', { ascending: true, nullsFirst: true })
    .limit(CRON_BATCH_SIZE)

  // Also include any app_ids NOT yet in the games table (new additions)
  const cachedIds = new Set((gameCache ?? []).map((g) => g.app_id))
  const uncachedIds = uniqueAppIds.filter((id) => !cachedIds.has(id))

  // Build the batch: uncached first (priority), then stalest cached
  const batchIds = [
    ...uncachedIds,
    ...(gameCache ?? []).map((g) => g.app_id),
  ].slice(0, CRON_BATCH_SIZE)

  console.log(`[CRON] Processing ${batchIds.length} games out of ${uniqueAppIds.length} tracked`)

  // ── 3. Fetch & upsert each game from Steam ───────────────────────────────
  const updatedAppIds: number[] = []

  for (const appId of batchIds) {
    stats.processed++

    try {
      const details = await fetchSteamAppDetails(appId)

      if (!details) {
        stats.errors.push(`appId ${appId}: no data returned from Steam`)
        await sleep(STEAM_REQUEST_DELAY_MS)
        continue
      }

      const { error: upsertError } = await supabase
        .from('games')
        .upsert(
          {
            app_id: details.app_id,
            title: details.title,
            header_image: details.header_image,
            base_price_cents: details.base_price_cents,
            current_price_cents: details.current_price_cents,
            discount_percent: details.discount_percent,
            last_updated_at: new Date().toISOString(),
          },
          { onConflict: 'app_id' }
        )

      if (upsertError) {
        stats.errors.push(`appId ${appId}: upsert failed — ${upsertError.message}`)
      } else {
        stats.updated++
        updatedAppIds.push(appId)
      }
    } catch (err) {
      stats.errors.push(`appId ${appId}: ${String(err)}`)
    }

    // Rate limit guard: 1.5s between Steam API calls
    await sleep(STEAM_REQUEST_DELAY_MS)
  }

  // ── 4. Check alert conditions ────────────────────────────────────────────
  if (updatedAppIds.length > 0) {
    const { data: alertRows, error: alertFetchError } = await supabase
      .from('user_tracked_games')
      .select(`
        id,
        profile_id,
        app_id,
        target_price_cents,
        notified_at,
        games!inner ( app_id, title, header_image, base_price_cents, current_price_cents, discount_percent, is_aaa, last_updated_at ),
        profiles!inner ( id, discord_webhook_url, wants_aaa_only )
      `)
      .in('app_id', updatedAppIds)

    if (alertFetchError) {
      console.error('[CRON] Alert fetch error:', alertFetchError)
    } else {
      for (const row of (alertRows as unknown as CronAlertRow[])) {
        const game    = row.games
        const profile = row.profiles

        if (!game || !profile) continue

        // Condition: current price is at or below the user's target
        const isPriceHit = game.current_price_cents > 0 &&
          game.current_price_cents <= row.target_price_cents

        if (!isPriceHit) continue

        // Condition: AAA filter — skip non-AAA games if user only wants AAA alerts
        if (profile.wants_aaa_only && !game.is_aaa) continue

        // Condition: Don't re-send the same alert (notified_at is set after last send)
        // Reset notified_at when price drops again (i.e., current price < last notified price)
        const alreadyNotified = row.notified_at !== null
        if (alreadyNotified) continue

        // No Discord webhook → skip
        if (!profile.discord_webhook_url) continue

        try {
          await sendDiscordAlert(profile.discord_webhook_url, game, row.target_price_cents)
          stats.alerts_sent++

          // Mark as notified
          await supabase
            .from('user_tracked_games')
            .update({ notified_at: new Date().toISOString() })
            .eq('id', row.id)
        } catch (err) {
          stats.errors.push(`Alert for ${game.title} (user ${row.profile_id}): ${String(err)}`)
        }
      }
    }
  }

  console.log(`[CRON] Done. Processed: ${stats.processed}, Updated: ${stats.updated}, Alerts: ${stats.alerts_sent}`)
  return NextResponse.json(stats)
}
