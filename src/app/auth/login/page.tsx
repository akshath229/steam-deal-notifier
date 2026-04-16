'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import styles from './page.module.css'

function LoginForm() {
  const searchParams  = useSearchParams()
  const redirectTo    = searchParams.get('redirectTo') ?? '/dashboard'

  const supabase = createClient()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className={styles.sentState}>
        <div className={styles.sentIcon}>✉️</div>
        <h2>Check your email</h2>
        <p>
          We sent a magic sign-in link to<br />
          <strong>{email}</strong>
        </p>
        <p className={styles.sentHint}>
          Click the link in the email to sign in. No password needed.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleLogin} className={styles.form}>
      <div className={styles.field}>
        <label htmlFor="login-email" className={styles.label}>
          Email address
        </label>
        <input
          id="login-email"
          type="email"
          className="input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>

      {error && (
        <div className={styles.error}>{error}</div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        id="login-submit-btn"
        disabled={loading || !email.trim()}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        {loading ? 'Sending…' : '✉️ Send Magic Link'}
      </button>

      <p className={styles.terms}>
        By signing in, you agree that we store your email to manage your wishlist and send alerts.
        No spam, no marketing.
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🎮</div>
        <h1 className={styles.title}>Sign in to SteamWatch</h1>
        <p className={styles.subtitle}>
          Track game prices and get Discord alerts — no password required.
        </p>

        <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
