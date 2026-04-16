import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { SettingsForm } from '@/components/SettingsForm'
import styles from './page.module.css'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Configure your Discord webhook and notification preferences for Steam deal alerts.',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null // middleware handles redirect

  const { data: profile } = await supabase
    .from('profiles')
    .select('discord_webhook_url, telegram_chat_id, wants_aaa_only')
    .eq('id', user.id)
    .single()

  const initialSettings = {
    discord_webhook_url: profile?.discord_webhook_url ?? null,
    telegram_chat_id:    profile?.telegram_chat_id ?? null,
    wants_aaa_only:      profile?.wants_aaa_only ?? false,
  }

  return (
    <div className="page-wrapper">
      <div className={styles.header}>
        <h1>⚙️ Settings</h1>
        <p className={styles.subtitle}>
          Configure where and how you receive deal alerts.
          <span className={styles.email}> Signed in as {user.email}</span>
        </p>
      </div>

      <div className={styles.content}>
        <SettingsForm initialSettings={initialSettings} />
      </div>
    </div>
  )
}
