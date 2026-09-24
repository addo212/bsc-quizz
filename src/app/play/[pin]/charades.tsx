'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Answer, Game, Participant, Question } from '@/types/types'
import { CHARADE_POINT } from '@/constants'
import { Button, Logo } from '@/components/ui'
import { cn, formatNumber } from '@/lib/utils'

/**
 * Layar pemain mode tebak kata — dipakai oleh PEMERAGA (pemegang HP).
 *
 * Layar ini menampilkan kata kunci + gambar. Penebak tidak boleh melihatnya,
 * jadi HP dipegang menghadap ke pemeraga. Setiap tim hanya berputar di
 * potongan soalnya sendiri (`question_start` / `question_count`), sehingga
 * tidak ada kata yang sama antar tim.
 */
export function PlayerCharades({
  game,
  participant,
  questions,
  answers,
  totalScore,
  submitting,
  onMark,
}: {
  game: Game
  participant: Participant
  questions: Question[]
  answers: Record<string, Answer>
  totalScore: number
  submitting: boolean
  onMark: (question: Question, correct: boolean, elapsedMs: number) => void
}) {
  const [now, setNow] = useState(() => Date.now())
  const shownAtRef = useRef(Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(interval)
  }, [])

  const byId = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions]
  )

  /**
   * Daftar kata milik tim ini, sesuai urutan yang ditulis host saat membagi.
   * Kosong berarti pembagian belum jalan (host belum menekan "Bagi soal").
   */
  const slice = useMemo(
    () =>
      (participant.question_ids ?? [])
        .map((id) => byId.get(id))
        .filter((question): question is Question => Boolean(question)),
    [participant.question_ids, byId]
  )

  const played = slice.filter((question) => answers[question.id]).length
  const current = slice.find((question) => !answers[question.id]) ?? null
  const correct = slice.filter(
    (question) => (answers[question.id]?.score ?? 0) > 0
  ).length

  // Hitung ulang waktu tampil setiap kata berganti.
  const currentId = current?.id ?? null
  useEffect(() => {
    shownAtRef.current = Date.now()
  }, [currentId])

  const round = game.current_round ?? 1
  const limitMs = (game.round_time_limit ?? 60) * 1000
  const startedAt = game.round_started_at
    ? new Date(game.round_started_at).getTime()
    : null
  const remainingMs =
    startedAt === null ? limitMs : Math.max(0, limitMs - (now - startedAt))
  const expired = remainingMs <= 0
  const count = slice.length
  const waiting = count === 0
  const finished = !waiting && current === null

  const locked = expired || waiting || finished || submitting

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Bar atas */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-white/40">
            {participant.nickname}
          </p>
          <p className="font-display text-lg font-extrabold text-white">
            Babak {round}
            <span className="text-white/35"> · kata {Math.min(played + 1, count)}/{count}</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Benar
            </p>
            <p className="font-display text-lg font-extrabold tabular-nums text-emerald-300">
              {correct}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Sisa waktu
            </p>
            <p
              className={cn(
                'font-display text-lg font-extrabold tabular-nums',
                expired ? 'text-rose-400' : 'text-violet-300'
              )}
            >
              {formatClock(remainingMs)}
            </p>
          </div>
        </div>
      </div>

      <div className="h-1.5 bg-white/5">
        <div
          className={cn(
            'h-full transition-[width] duration-500 ease-linear',
            expired ? 'bg-rose-400' : 'bg-violet-400'
          )}
          style={{
            width: `${limitMs > 0 ? Math.min(100, (remainingMs / limitMs) * 100) : 0}%`,
          }}
        />
      </div>

      {/* Isi */}
      <div className="flex flex-1 flex-col px-4 py-5">
        {waiting ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-300ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-150ms]" />
              <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400" />
            </div>
            <h2 className="mt-5 font-display text-xl font-extrabold text-white">
              Menunggu host membagi kata…
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/50">
              Kata untuk tim kamu sedang dibagikan. Layar ini akan otomatis
              berganti.
            </p>
          </div>
        ) : current ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-300/80">
                ⚠️ Jangan tunjukkan layar ini ke penebak
              </p>
              {current.category?.trim() && (
                <span className="shrink-0 rounded-lg bg-violet-500/20 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-violet-200">
                  {current.category.trim()}
                </span>
              )}
            </div>

            {current.image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={current.image_url}
                alt=""
                className="mx-auto mt-3 max-h-40 w-auto rounded-2xl object-contain sm:max-h-52"
              />
            )}

            <div className="mt-4 flex flex-1 items-center justify-center">
              <h2 className="w-full animate-slide-up rounded-3xl bg-white px-5 py-10 text-center font-display text-3xl font-extrabold leading-tight text-slate-900 shadow-2xl sm:text-5xl">
                {current.body}
              </h2>
            </div>

            {expired && (
              <p className="mt-4 rounded-2xl bg-rose-500/10 px-4 py-3 text-center text-sm font-semibold text-rose-300">
                ⏱ Waktu babak habis — tunggu host membuka babak berikutnya.
              </p>
            )}
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="text-5xl">🎉</div>
            <h2 className="mt-4 font-display text-2xl font-extrabold text-white">
              Semua katamu sudah dimainkan
            </h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-white/55">
              Tim kamu menebak <b className="text-emerald-300">{correct}</b> dari{' '}
              {count} kata. Tunggu host membuka babak berikutnya.
            </p>
          </div>
        )}
      </div>

      {/* Tombol penilaian */}
      <div className="safe-bottom px-4 pb-5">
        {waiting ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/45">
            Tombol Benar/Lewati muncul begitu kata dibagikan.
          </div>
        ) : finished ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/50">
            Skor tim: {formatNumber(totalScore)} kata benar
            <span className="block text-xs text-white/35">
              (+{CHARADE_POINT} poin untuk setiap kata yang berhasil ditebak)
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="xl"
              variant="success"
              className="h-20 text-lg"
              disabled={locked}
              onClick={() =>
                current &&
                onMark(current, true, Date.now() - shownAtRef.current)
              }
            >
              ✓ BENAR
            </Button>
            <Button
              size="xl"
              variant="secondary"
              className="h-20 text-lg"
              disabled={locked}
              onClick={() =>
                current &&
                onMark(current, false, Date.now() - shownAtRef.current)
              }
            >
              Lewati →
            </Button>
          </div>
        )}
        <p className="mt-3 text-center text-xs text-white/35">
          Tekan BENAR kalau penebak menyebut katanya dengan tepat. Lewati untuk
          pindah ke kata berikutnya tanpa poin.
        </p>
      </div>

      <div className="flex justify-center pb-5">
        <Logo tone="light" />
      </div>
    </div>
  )
}

/** 65000 -> "01:05" */
function formatClock(ms: number) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
