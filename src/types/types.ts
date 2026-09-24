import { createClient } from '@supabase/supabase-js'
import { Database } from './supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * Bernilai false kalau `.env.local` belum diisi.
 * Halaman akan menampilkan panduan setup alih-alih error yang membingungkan.
 */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

export type Participant = Database['public']['Tables']['participants']['Row']

export type Choice = Database['public']['Tables']['choices']['Row']

export type Question = Database['public']['Tables']['questions']['Row'] & {
  choices: Choice[]
}

export type QuizSet = Database['public']['Tables']['quiz_sets']['Row'] & {
  questions: Question[]
}

export type Answer = Database['public']['Tables']['answers']['Row']

export type Game = Database['public']['Tables']['games']['Row']

export type GameResult = Database['public']['Views']['game_results']['Row']

/** Profil host: menyimpan status persetujuan akun. */
export type Profile = Database['public']['Tables']['profiles']['Row']

export type ProfileStatus = Profile['status']

export type QuestionType = Database['public']['Tables']['questions']['Row']['question_type']

/**
 * Cara permainan dijalankan.
 * - `classic`  : semua pemain menjawab soal yang sama.
 * - `charades` : tebak kata, tiap tim dapat kata berbeda (lihat `supabase/charades.sql`).
 */
export type GameMode = Database['public']['Tables']['games']['Row']['mode']

/** Peserta = satu tim (1 HP per tim) saat mode tebak kata. */
export type Team = Participant

/**
 * Bentuk soal yang dibaca pemain lewat RPC `get_game_questions`
 * (lihat `supabase/hardening.sql`). Kunci jawaban (`text_answer` dan
 * `is_correct`) bernilai null selama jawaban belum di-reveal.
 */
export type GameQuestion = {
  id: string
  body: string
  image_url: string | null
  order: number
  time_limit: number
  points: number
  question_type: QuestionType
  text_exact: boolean
  text_answer: string | null
  choices: {
    id: string
    body: string
    is_correct: boolean | null
  }[]
}
