export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      games: {
        Row: {
          code: string
          created_at: string
          current_turn_index: number | null
          difficulty: string
          host_player_id: string | null
          id: string
          imposter_clue: string | null
          imposter_count: number
          imposter_min: number
          imposter_max: number
          imposter_random: boolean
          clue_rounds: number
          phase: string
          word: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_turn_index?: number | null
          difficulty?: string
          host_player_id?: string | null
          id?: string
          imposter_clue?: string | null
          imposter_count?: number
          imposter_min?: number
          imposter_max?: number
          imposter_random?: boolean
          clue_rounds?: number
          phase?: string
          word?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_turn_index?: number | null
          difficulty?: string
          host_player_id?: string | null
          id?: string
          imposter_clue?: string | null
          imposter_count?: number
          imposter_min?: number
          imposter_max?: number
          imposter_random?: boolean
          clue_rounds?: number
          phase?: string
          word?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_host"
            columns: ["host_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          clue: string | null
          created_at: string
          game_id: string
          has_voted: boolean
          id: string
          is_host: boolean
          is_imposter: boolean
          name: string
          turn_order: number | null
          vote_for: string | null
        }
        Insert: {
          clue?: string | null
          created_at?: string
          game_id: string
          has_voted?: boolean
          id?: string
          is_host?: boolean
          is_imposter?: boolean
          name: string
          turn_order?: number | null
          vote_for?: string | null
        }
        Update: {
          clue?: string | null
          created_at?: string
          game_id?: string
          has_voted?: boolean
          id?: string
          is_host?: boolean
          is_imposter?: boolean
          name?: string
          turn_order?: number | null
          vote_for?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "players_vote_for_fkey"
            columns: ["vote_for"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      session_scores: {
        Row: {
          id: string
          game_id: string
          player_id: string
          score: number
          rounds_won: number
          correct_votes: number
          created_at: string
        }
        Insert: {
          id?: string
          game_id: string
          player_id: string
          score?: number
          rounds_won?: number
          correct_votes?: number
          created_at?: string
        }
        Update: {
          id?: string
          game_id?: string
          player_id?: string
          score?: number
          rounds_won?: number
          correct_votes?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
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

export type Tables<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof Database["public"]["Tables"]
> = Database["public"]["Tables"][T]["Update"]
