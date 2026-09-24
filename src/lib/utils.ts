import { PIN_LENGTH, SPEED_PENALTY } from '@/constants'

/** Gabung className dengan aman (pengganti clsx). */
export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

/** PIN 6 digit, tidak dimulai dengan 0 supaya enak dibaca/diucapkan. */
export function randomPin() {
  const min = 10 ** (PIN_LENGTH - 1)
  const max = 10 ** PIN_LENGTH - 1
  return String(Math.floor(min + Math.random() * (max - min + 1)))
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

/**
 * Skor satu jawaban.
 * - Salah / tidak menjawab => 0
 * - Benar => poin penuh kalau instan, `points * (1 - SPEED_PENALTY)` kalau mentok waktu.
 */
export function scoreForAnswer({
  isCorrect,
  elapsedMs,
  timeLimitSec,
  points,
}: {
  isCorrect: boolean
  elapsedMs: number
  timeLimitSec: number
  points: number
}) {
  if (!isCorrect) return 0
  const total = Math.max(1, timeLimitSec * 1000)
  const ratio = clamp(elapsedMs / total, 0, 1)
  return Math.round(points * (1 - SPEED_PENALTY * ratio))
}

/** "1.234" */
export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value)
}

/** Inisial untuk avatar: "Rizky Putra" -> "RP" */
export function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/** Warna avatar deterministik dari nama. */
const AVATAR_COLORS = [
  'bg-violet-500',
  'bg-sky-500',
  'bg-rose-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-fuchsia-500',
  'bg-cyan-500',
  'bg-indigo-500',
]

export function avatarColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 100000
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length]
}

/** Nama file yang aman untuk diunduh. */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'quiz'
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
