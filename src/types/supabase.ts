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

/**
 * Cara permainan dijalankan.
 * - `classic`  : semua pemain menjawab soal yang sama, poin berdasarkan kecepatan.
 * - `charades` : tebak kata / peragaan. Satu HP per tim, soal dibagi rata dan
 *                tiap tim mendapat kata yang berbeda, dinilai Benar/Salah.
 */
export type GameMode = 'classic' | 'charades'

export type QuestionType = 'choice' | 'text'

/** Status persetujuan akun host. */
export type ProfileStatus = 'pending' | 'approved' | 'rejected'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          provider: string | null
          status: ProfileStatus
          is_admin: boolean
          created_at: string
          reviewed_at: string | null
          reviewed_by: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          status?: ProfileStatus
          is_admin?: boolean
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          provider?: string | null
          status?: ProfileStatus
          is_admin?: boolean
          created_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
        }
        Relationships: []
      }
      quiz_sets: {
        Row: {
          id: string
          created_at: string
          name: string
          description: string | null
          user_id: string | null
          cover_color: string
          is_public: boolean
          game_mode: GameMode
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          description?: string | null
          user_id?: string | null
          cover_color?: string
          is_public?: boolean
          game_mode?: GameMode
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          description?: string | null
          user_id?: string | null
          cover_color?: string
          is_public?: boolean
          game_mode?: GameMode
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
          question_type: QuestionType
          text_answer: string | null
          text_exact: boolean
          category: string | null
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
          question_type?: QuestionType
          text_answer?: string | null
          text_exact?: boolean
          category?: string | null
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
          question_type?: QuestionType
          text_answer?: string | null
          text_exact?: boolean
          category?: string | null
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
          mode: GameMode
          round_time_limit: number
          current_round: number
          round_started_at: string | null
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
          mode?: GameMode
          round_time_limit?: number
          current_round?: number
          round_started_at?: string | null
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
          mode?: GameMode
          round_time_limit?: number
          current_round?: number
          round_started_at?: string | null
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
          team_index: number | null
          /** Daftar soal yang menjadi giliran tim ini (mode tebak kata). */
          question_ids: string[]
        }
        Insert: {
          id?: string
          created_at?: string
          nickname: string
          game_id: string
          user_id?: string
          team_index?: number | null
          question_ids?: string[]
        }
        Update: {
          id?: string
          created_at?: string
          nickname?: string
          game_id?: string
          user_id?: string
          team_index?: number | null
          question_ids?: string[]
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
          free_text: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          participant_id?: string
          question_id: string
          score: number
          choice_id?: string | null
          time_taken_ms?: number
          free_text?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          participant_id?: string
          question_id?: string
          score?: number
          choice_id?: string | null
          time_taken_ms?: number
          free_text?: string | null
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
