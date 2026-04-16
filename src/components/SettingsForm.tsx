'use client'

import { useState } from 'react'
import styles from './SettingsForm.module.css'

interface SettingsFormProps {
  initialSettings: {
    discord_webhook_url: string | null
    telegram_chat_id: string | null
    wants_aaa_only: boolean
  }
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [discordUrl,   setDiscordUrl]   = useState(initialSettings.discord_webhook_url ?? '')
  const [telegramId,   setTelegramId]   = useState(initialSettings.telegram_chat_id ?? '')
  const [wantsAaaOnly, setWantsAaaOnly] = useState(initialSettings.wants_aaa_only)
  const [saving,   setSaving]   = useState(false)
  const [success,  setSuccess]  = useState(false)
  const [error,    setError]    = useState('')

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    setError('')

    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        discord_webhook_url: discordUrl.trim() || null,
        telegram_chat_id:    telegramId.trim() || null,
        wants_aaa_only:      wantsAaaOnly,
      }),
    })

    if (res.ok) {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to save settings.')
    }

    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className={styles.form}>
      {/* Discord Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>💬</div>
          <div>
            <h3 className={styles.sectionTitle}>Discord Webhook</h3>
            <p className={styles.sectionDesc}>
              Receive price drop alerts directly in your Discord server.
            </p>
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="discord-url" className={styles.label}>Webhook URL</label>
          <input
            id="discord-url"
            type="url"
            className="input"
            placeholder="https://discord.com/api/webhooks/..."
            value={discordUrl}
            onChange={(e) => setDiscordUrl(e.target.value)}
          />
          <p className={styles.hint}>
            In Discord: Channel Settings → Integrations → Webhooks → New Webhook → Copy URL
          </p>
        </div>
      </div>

      {/* AAA Filter Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>🎯</div>
          <div>
            <h3 className={styles.sectionTitle}>AAA Alert Filter</h3>
            <p className={styles.sectionDesc}>
              Only notify me about major AAA game deals (original price ≥ $40 or from major publishers).
            </p>
          </div>
          <div className={styles.toggleWrapper}>
            <label className="toggle" htmlFor="aaa-toggle">
              <input
                id="aaa-toggle"
                type="checkbox"
                checked={wantsAaaOnly}
                onChange={(e) => setWantsAaaOnly(e.target.checked)}
              />
              <span className="toggle-track" />
            </label>
          </div>
        </div>

        {wantsAaaOnly && (
          <div className={styles.aaaNote}>
            <span>⭐</span>
            <span>
              Only price drops for games originally priced ≥ $40.00 or from publishers such as
              Activision, EA, Ubisoft, Bethesda, 2K, Rockstar, Square Enix, and others will
              trigger Discord notifications.
            </span>
          </div>
        )}
      </div>

      {/* Telegram placeholder */}
      <div className={`${styles.section} ${styles.comingSoon}`}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>✈️</div>
          <div>
            <h3 className={styles.sectionTitle}>Telegram <span className={styles.soon}>Coming Soon</span></h3>
            <p className={styles.sectionDesc}>
              Telegram bot notifications will be added in a future update.
            </p>
          </div>
        </div>
      </div>

      {/* Status messages */}
      {error && (
        <div className={styles.errorMsg}>{error}</div>
      )}
      {success && (
        <div className={styles.successMsg}>✓ Settings saved successfully!</div>
      )}

      <div className={styles.actions}>
        <button
          type="submit"
          className="btn btn-primary"
          id="save-settings-btn"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </form>
  )
}
