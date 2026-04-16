# Steam Deal Tracker

A modern, fast, and minimalistic game deal tracking application that monitors Steam prices and sends automated Discord notifications when target prices are met. Built with a Notion-inspired warm, aesthetic design system.

## Features

- **Live Dashboard:** Discover featured deals on Steam and explore trending games.
- **Wishlist Tracking:** Add specific games to your tracker with a target price drop threshold.
- **Discord Notifications:** Receive automated alerts in your Discord server when a tracked game hits your target price.
- **Currency Support:** View game deals in USD or INR formats.
- **Background Process:** Integrated with Vercel Cron to automatically survey the Steam Web API for regular updates.
- **Notion-Inspired Aesthetic:** A stylish interface utilizing warm neutral color palettes, clean fonts, and sleek component designs.

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Database & Authentication:** [Supabase](https://supabase.com/)
- **Client Data Fetching:** [SWR](https://swr.vercel.app/)
- **Styling:** Custom Vanilla CSS for the Notion-like aesthetic
- **External API:** [Steam Web API](https://steamcommunity.com/dev)

## Prerequisites

Before starting, make sure you have:
1. **Supabase Project:** Created at Supabase Dashboard.
2. **Steam API Key:** Acquired from the [Steam Developer Portal](https://steamcommunity.com/dev/apikey).
3. **Discord Webhook URL:** Optional for testing default push alerts (via `Server Settings` -> `Integrations` -> `Webhooks`).
