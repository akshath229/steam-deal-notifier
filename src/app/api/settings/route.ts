import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/settings
 * Returns the authenticated user's profile (notification preferences).
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('discord_webhook_url, telegram_chat_id, wants_aaa_only')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('[/api/settings GET]', error)
    return NextResponse.json({ error: 'Failed to load settings.' }, { status: 500 })
  }

  return NextResponse.json({ settings: data })
}

/**
 * PUT /api/settings
 * Body: { discord_webhook_url?: string, telegram_chat_id?: string, wants_aaa_only?: boolean }
 * Updates the authenticated user's notification preferences.
 */
export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { discord_webhook_url, telegram_chat_id, wants_aaa_only } = body

  const { error } = await supabase
    .from('profiles')
    .update({ discord_webhook_url, telegram_chat_id, wants_aaa_only })
    .eq('id', user.id)

  if (error) {
    console.error('[/api/settings PUT]', error)
    return NextResponse.json({ error: 'Failed to save settings.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
