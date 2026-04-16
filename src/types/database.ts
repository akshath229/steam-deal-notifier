// ─── Database Types ───────────────────────────────────────────────────────────
// These types mirror the Supabase schema defined in supabase/schema.sql.
// They are used to type the Supabase client calls throughout the application.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          discord_webhook_url: string | null
          telegram_chat_id: string | null
          wants_aaa_only: boolean
          created_at: string
        }
        Insert: {
          id: string
          discord_webhook_url?: string | null
          telegram_chat_id?: string | null
          wants_aaa_only?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          discord_webhook_url?: string | null
          telegram_chat_id?: string | null
          wants_aaa_only?: boolean
        }
        Relationships: []
      }
      games: {
        Row: {
          app_id: number
          title: string
          header_image: string | null
          base_price_cents: number
          current_price_cents: number
          discount_percent: number
          is_aaa: boolean
          last_updated_at: string | null
        }
        Insert: {
          app_id: number
          title: string
          header_image?: string | null
          base_price_cents: number
          current_price_cents: number
          discount_percent: number
          // is_aaa is a GENERATED ALWAYS column — must NOT be in Insert
          last_updated_at?: string | null
        }
        Update: {
          app_id?: number
          title?: string
          header_image?: string | null
          base_price_cents?: number
          current_price_cents?: number
          discount_percent?: number
          // is_aaa is a GENERATED ALWAYS column — must NOT be in Update
          last_updated_at?: string | null
        }
        Relationships: []
      }
      user_tracked_games: {
        Row: {
          id: string
          profile_id: string
          app_id: number
          target_price_cents: number
          notified_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          app_id: number
          target_price_cents: number
          notified_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          app_id?: number
          target_price_cents?: number
          notified_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ─── Convenience Row Types ────────────────────────────────────────────────────

export type Profile         = Database['public']['Tables']['profiles']['Row']
export type Game            = Database['public']['Tables']['games']['Row']
export type UserTrackedGame = Database['public']['Tables']['user_tracked_games']['Row']

/** A tracked game joined with its game details — used in the wishlist view */
export type TrackedGameWithDetails = UserTrackedGame & {
  games: Game
}
