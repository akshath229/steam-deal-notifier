/**
 * Known major AAA publishers used to tag games as AAA
 * even if they are temporarily priced below $40 (e.g., during sales).
 */
export const AAA_PUBLISHERS = new Set([
  'Activision',
  'Activision Blizzard',
  'Blizzard Entertainment',
  'Electronic Arts',
  'EA Games',
  'Ubisoft',
  'Bethesda Softworks',
  'Bethesda',
  '2K Games',
  '2K',
  'Rockstar Games',
  'Square Enix',
  'Bandai Namco Entertainment',
  'Bandai Namco',
  'Capcom',
  'Warner Bros. Games',
  'Warner Bros. Interactive Entertainment',
  'THQ Nordic',
  'SEGA',
  'Paradox Interactive',
  'Focus Entertainment',
  'Deep Silver',
  'Koch Media',
  'Take-Two Interactive',
  'Sony Interactive Entertainment',
  'Microsoft Studios',
  'Xbox Game Studios',
])

/** Steam API base URLs */
export const STEAM_STORE_API   = 'https://store.steampowered.com/api'
export const STEAM_FEATURED_URL = `${STEAM_STORE_API}/featured`
export const STEAM_SEARCH_URL   = 'https://store.steampowered.com/api/storesearch/'

/** Price below which a game is not considered AAA (paise) */
export const AAA_PRICE_THRESHOLD_CENTS = 200000  // ₹2000.00

/** Max games to process per CRON invocation */
export const CRON_BATCH_SIZE = 30

/** Delay between Steam API requests (ms) to respect rate limits */
export const STEAM_REQUEST_DELAY_MS = 1500
