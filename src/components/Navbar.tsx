'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import styles from './Navbar.module.css'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Deals',    icon: '🔥' },
  { href: '/search',    label: 'Search',   icon: '🔍' },
  { href: '/wishlist',  label: 'Wishlist', icon: '⭐' },
  { href: '/settings',  label: 'Settings', icon: '⚙️' },
]

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()
  const supabase = createClient()

  const [user, setUser]   = useState<User | null>(null)
  const [open, setOpen]   = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSignOut() {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/dashboard')
    setLoading(false)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link href="/dashboard" className={styles.logo}>
          <span className={styles.logoIcon}>🎮</span>
          <span className={styles.logoText}>SteamWatch</span>
        </Link>

        {/* Desktop Links */}
        <div className={styles.links}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${pathname === link.href ? styles.active : ''}`}
            >
              <span className={styles.linkIcon}>{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth */}
        <div className={styles.auth}>
          {user ? (
            <div className={styles.userArea}>
              <span className={styles.userEmail}>{user.email?.split('@')[0]}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={handleSignOut}
                disabled={loading}
              >
                {loading ? '...' : 'Sign out'}
              </button>
            </div>
          ) : (
            <Link href="/auth/login" className="btn btn-primary btn-sm">
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className={styles.hamburger}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span className={`${styles.ham} ${open ? styles.hamOpen : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className={styles.mobileMenu}>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.mobileLink} ${pathname === link.href ? styles.active : ''}`}
              onClick={() => setOpen(false)}
            >
              {link.icon} {link.label}
            </Link>
          ))}
          <div className={styles.mobileDivider} />
          {user ? (
            <button className="btn btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          ) : (
            <Link href="/auth/login" className="btn btn-primary" onClick={() => setOpen(false)}>
              Sign in
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
