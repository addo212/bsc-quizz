/** Lama waktu menjawab default sebuah soal (detik) */
export const DEFAULT_TIME_LIMIT = 20
/** Poin maksimal yang bisa didapat dari satu soal */
export const DEFAULT_POINTS = 1000

export const MIN_TIME_LIMIT = 5
export const MAX_TIME_LIMIT = 120
export const MIN_POINTS = 100
export const MAX_POINTS = 2000

/** Panjang PIN ruangan */
export const PIN_LENGTH = 6
export const MAX_NICKNAME_LENGTH = 20
export const MAX_NAME_LENGTH = 80

/**
 * Pemain hanya mendapat sebagian poin jika menjawab lebih lambat.
 * Rumus: `points * (1 - 0.5 * elapsed / timeLimit)`
 * => poin penuh kalau instan, separuh poin kalau tepat di detik terakhir.
 */
export const SPEED_PENALTY = 0.5

/** Jenis soal yang didukung */
export const QUESTION_TYPES = [
  {
    id: 'choice',
    label: 'Pilihan ganda',
    hint: 'Pemain memilih satu dari 2–4 jawaban.',
  },
  {
    id: 'text',
    label: 'Jawaban diketik',
    hint: 'Pemain mengetik jawabannya, harus sama dengan kunci jawaban.',
  },
] as const

/** Batas panjang jawaban yang diketik pemain */
export const MAX_TEXT_ANSWER_LENGTH = 80

/* -------------------------------------------------------------------------- */
/*  Mode permainan                                                            */
/* -------------------------------------------------------------------------- */

/**
 * `classic`  — semua pemain menjawab soal yang sama, poin pakai bonus kecepatan.
 * `charades` — tebak kata: 1 HP per tim, tiap tim dapat kata berbeda,
 *              dinilai Benar (+1) / Salah (0) oleh pemegang HP.
 */
export const GAME_MODES = [
  {
    id: 'classic',
    label: 'Klasik',
    hint: 'Semua pemain menjawab soal yang sama. Poin + bonus kecepatan.',
  },
  {
    id: 'charades',
    label: 'Tebak Kata',
    hint: '1 HP per tim (2 orang). Tiap tim dapat kata berbeda, main serentak per babak.',
  },
] as const

export type GameModeId = (typeof GAME_MODES)[number]['id']

/** Poin untuk satu kata yang berhasil ditebak di mode Tebak Kata. */
export const CHARADE_POINT = 1

/** Pilihan durasi satu babak Tebak Kata (detik) */
export const ROUND_TIME_OPTIONS = [30, 45, 60, 90, 120, 180]

export const DEFAULT_ROUND_TIME = 60
export const MIN_ROUND_TIME = 10
export const MAX_ROUND_TIME = 300

/** Nama kategori untuk kata yang tidak diberi kategori. */
export const DEFAULT_CATEGORY_LABEL = 'Tanpa kategori'

/** Batas panjang nama kategori */
export const MAX_CATEGORY_LENGTH = 30

/**
 * Cara membagi kata antar tim di mode Tebak Kata.
 * Semua pilihan tetap menjamin tidak ada kata yang dipakai dua tim.
 */
export const CHARADE_DIVISIONS = [
  {
    id: 'category-mix',
    label: 'Campur rata per kategori',
    hint: 'Tiap tim dapat campuran seimbang dari semua kategori, mis. 2 Hewan + 2 Benda + 1 Perbuatan.',
  },
  {
    id: 'sequence',
    label: 'Berurutan',
    hint: 'Kata dibagi rata mengikuti urutan di editor, tanpa memperhatikan kategori.',
  },
] as const

export type CharadeDivision = (typeof CHARADE_DIVISIONS)[number]['id']

/** Opsi tema warna cover quiz */
export const COVER_COLORS = [
  { id: 'violet', label: 'Violet', from: '#7c3aed', to: '#c026d3' },
  { id: 'ocean', label: 'Ocean', from: '#0284c7', to: '#06b6d4' },
  { id: 'sunset', label: 'Sunset', from: '#f97316', to: '#e11d48' },
  { id: 'forest', label: 'Forest', from: '#059669', to: '#84cc16' },
  { id: 'midnight', label: 'Midnight', from: '#1e293b', to: '#4f46e5' },
  { id: 'rose', label: 'Rose', from: '#e11d48', to: '#f472b6' },
] as const

export type CoverColorId = (typeof COVER_COLORS)[number]['id']

export function coverGradient(id: string | null | undefined) {
  const found = COVER_COLORS.find((c) => c.id === id) ?? COVER_COLORS[0]
  return { from: found.from, to: found.to }
}

/**
 * Gaya 4 kotak jawaban ala Kahoot: warna + bentuk berbeda supaya
 * mudah dikenali dan ramah pengguna buta warna.
 */
export const ANSWER_STYLES = [
  {
    shape: 'triangle' as const,
    label: 'Segitiga',
    bg: 'bg-rose-500',
    bgSoft: 'bg-rose-500/15',
    text: 'text-rose-600',
    border: 'border-rose-500',
    ring: 'ring-rose-500',
    dot: 'bg-rose-500',
  },
  {
    shape: 'diamond' as const,
    label: 'Belah ketupat',
    bg: 'bg-sky-500',
    bgSoft: 'bg-sky-500/15',
    text: 'text-sky-600',
    border: 'border-sky-500',
    ring: 'ring-sky-500',
    dot: 'bg-sky-500',
  },
  {
    shape: 'circle' as const,
    label: 'Lingkaran',
    bg: 'bg-amber-400',
    bgSoft: 'bg-amber-400/15',
    text: 'text-amber-600',
    border: 'border-amber-400',
    ring: 'ring-amber-400',
    dot: 'bg-amber-400',
  },
  {
    shape: 'square' as const,
    label: 'Kotak',
    bg: 'bg-emerald-500',
    bgSoft: 'bg-emerald-500/15',
    text: 'text-emerald-600',
    border: 'border-emerald-500',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
]
