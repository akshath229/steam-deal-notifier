import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'
import { Navbar } from '@/components/Navbar'
export const metadata: Metadata = {
  title: {
    default: 'SteamWatch — Game Deal Tracker',
    template: '%s | SteamWatch',
  },
  description:
    'Track Steam game prices, set target alerts, and get notified on Discord the moment a deal drops. Your personal game deal dashboard.',
  keywords: ['steam', 'game deals', 'price tracker', 'wishlist', 'steam sales', 'discord alerts'],
  openGraph: {
    type: 'website',
    siteName: 'SteamWatch',
    title: 'SteamWatch — Game Deal Tracker',
    description: 'Track Steam game prices and get Discord alerts when deals drop.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Navbar />
        <main className="page-content">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  )
}
