/**
 * Tipe database Supabase.
 *
 * File ini ditulis manual agar cocok dengan `supabase/setup.sql`.
 * Kalau Anda memakai Supabase CLI + Docker, Anda bisa menggantinya dengan hasil
 * generate otomatis:
 *   supabase gen types typescript --project-id <ref> --schema public > src/types/supabase.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type GamePhase = 'lobby' | 'quiz' | 'result'

export interface Database {
  public: {
    Tables: {
      quiz_sets: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          user_id: string | null
          cover_color: string
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          user_id?: string | null
          cover_color?: string
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          user_id?: string | null
          cover_color?: string
          is_public?: boolean
        }
        Relationships: []
      }
      questions: {
        Row: {
          id: string
          created_at: string
          body: string
          image_url: string | null
          order: number
          quiz_set_id: string
          time_limit: number
          points: number
        }
        Insert: {
          id?: string
          created_at?: string
          body: string
          image_url?: string | null
          order: number
          quiz_set_id: string
          time_limit?: number
          points?: number
        }
        Update: {
          id?: string
          created_at?: string
          body?: string
          image_url?: string | null
          order?: number
          quiz_set_id?: string
          time_limit?: number
          points?: number
        }
        Relationships: []
      }
      choices: {
        Row: {
          id: string
          created_at: string
          question_id: string
          body: string
          is_correct: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          question_id: string
          body: string
          is_correct?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          question_id?: string
          body?: string
          is_correct?: boolean
        }
        Relationships: []
      }
      games: {
        Row: {
          id: string
          created_at: string
          current_question_sequence: number
          is_answer_revealed: boolean
          phase: GamePhase
          quiz_set_id: string
          host_user_id: string | null
          pin: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          current_question_sequence?: number
          is_answer_revealed?: boolean
          phase?: GamePhase
          quiz_set_id: string
          host_user_id?: string | null
          pin?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          current_question_sequence?: number
          is_answer_revealed?: boolean
          phase?: GamePhase
          quiz_set_id?: string
          host_user_id?: string | null
          pin?: string | null
        }
        Relationships: []
      }
      participants: {
        Row: {
          id: string
          created_at: string
          nickname: string
          game_id: string
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          nickname: string
          game_id: string
          user_id?: string
        }
        Update: {
          id?: string
          created_at?: string
          nickname?: string
          game_id?: string
          user_id?: string
        }
        Relationships: []
      }
      answers: {
        Row: {
          id: string
          created_at: string
          participant_id: string
          question_id: string
          score: number
          choice_id: string | null
          time_taken_ms: number
        }
        Insert: {
          id?: string
          created_at?: string
          participant_id?: string
          question_id: string
          score: number
          choice_id?: string | null
          time_taken_ms?: number
        }
        Update: {
          id?: string
          created_at?: string
          participant_id?: string
          question_id?: string
          score?: number
          choice_id?: string | null
          time_taken_ms?: number
        }
        Relationships: []
      }
    }
    Views: {
      game_results: {
        Row: {
          participant_id: string | null
          nickname: string | null
          game_id: string | null
          total_score: number | null
          answered_count: number | null
          correct_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_question: {
        Args: {
          quiz_set_id: string
          body: string
          order: number
          choices: Json[]
        }
        Returns: string
      }
      get_game_questions: {
        Args: { p_game_id: string }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
