'use client'

import { useEffect, useMemo, useState } from 'react'
import { Answer, Game, Participant } from '@/types/types'
import { CHARADE_POINT } from '@/constants'
import { CharadeWord, summarizeCategories } from '@/lib/game'
import { Button, Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

/**
 * Layar kontrol host untuk mode tebak kata.
 *
 * Semua tim bermain serentak dalam satu babak berdurasi tetap. Host hanya
 * perlu menekan "Babak berikutnya" sampai semua tim kehabisan katanya, lalu
 * "Selesai" untuk membuka papan hasil.
 */
export function HostCharades({
  pin,
  quizName,
  game,
  players,
  words,
  answers,
  busy,
  onNextRound,
  onFinish,
  onBackToLobby,
}: {
  pin: string
  quizName: string
  game: Game
  players: Participant[]
  /** Semua kata kuis — dipakai untuk menampilkan komposisi kategori tiap tim. */
  words: CharadeWord[]
  answers: Answer[]
  busy: boolean
  onNextRound: () => void
  onFinish: () => void
  onBackToLobby: () => void
}) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 500)
    return () => window.clearInterval(interval)
  }, [])

  const round = game.current_round ?? 1
  const limitMs = (game.round_time_limit ?? 60) * 1000
  const startedAt = game.round_started_at
    ? new Date(game.round_started_at).getTime()
    : null
  const remainingMs =
    startedAt === null ? limitMs : Math.max(0, limitMs - (now - startedAt))
  const expired = remainingMs <= 0

  /** Rekap tiap tim: berapa kata dijawab, berapa yang benar. */
  const board = useMemo(
    () =>
      players.map((player) => {
        const ids = player.question_ids ?? []
        const assigned = new Set(ids)
        const mine = answers.filter(
          (answer) =>
            answer.participant_id === player.id &&
            assigned.has(answer.question_id)
        )
        const correct = mine.filter((answer) => answer.score > 0).length

        return {
          player,
          correct,
          played: mine.length,
          total: ids.length,
          composition: summarizeCategories(words, ids),
          exhausted: ids.length > 0 && mine.length >= ids.length,
        }
      }),
    [players, answers, words]
  )

  const ranking = board
    .slice()
    .sort((a, b) => b.correct - a.correct || a.played - b.played)
    .map((entry) => entry.player.id)
  const rankOf = (id: string) => ranking.indexOf(id) + 1

  const allExhausted =
    board.length > 0 && board.every((entry) => entry.exhausted)

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-8 sm:py-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-6xl">
        {/* Bar atas */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Logo tone="light" />
            <h1 className="mt-3 font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              {quizName}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-white/50">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/80">
                🎭 Tebak Kata
              </span>
              <span>
                PIN <span className="font-mono font-bold text-white">{pin}</span>
              </span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Babak
            </p>
            <p className="font-display text-4xl font-extrabold leading-none text-white">
              {round}
            </p>
          </div>
        </div>

        {/* Timer babak */}
        <div
          className={cn(
            'mt-6 rounded-3xl border p-5 backdrop-blur transition-colors sm:p-6',
            expired
              ? 'border-rose-400/40 bg-rose-500/10'
              : 'border-white/10 bg-white/5'
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                {expired ? 'Waktu babak habis' : 'Sisa waktu babak'}
              </p>
              <p
                className={cn(
                  'font-display text-5xl font-extrabold tabular-nums leading-none sm:text-6xl',
                  expired ? 'text-rose-300' : 'text-white'
                )}
              >
                {formatClock(remainingMs)}
              </p>
              <p className="mt-2 text-xs text-white/45">
                {game.round_time_limit ?? 60} detik · semua tim bermain
                serentak · +{CHARADE_POINT} poin per kata benar
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={onNextRound}
                loading={busy}
                className={cn(expired && 'animate-pulse')}
              >
                Babak berikutnya →
              </Button>
              <Button variant="secondary" onClick={onFinish} disabled={busy}>
                Selesai &amp; lihat hasil
              </Button>
              <Button variant="ghost" onClick={onBackToLobby} disabled={busy}>
                Lobby
              </Button>
            </div>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-500 ease-linear',
                expired ? 'bg-rose-400' : 'bg-violet-400'
              )}
              style={{
                width: `${limitMs > 0 ? Math.min(100, (remainingMs / limitMs) * 100) : 0}%`,
              }}
            />
          </div>

          {allExhausted && (
            <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300">
              ✓ Semua tim sudah menghabiskan katanya. Tekan “Selesai &amp; lihat
              hasil” untuk membuka papan skor.
            </p>
          )}
        </div>

        {/* Papan skor tim */}
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-extrabold text-white">
              Papan skor tim
            </h2>
            <span className="text-xs text-white/40">
              {board.reduce((sum, entry) => sum + entry.correct, 0)} kata benar
            </span>
          </div>

          {board.length === 0 ? (
            <p className="mt-4 rounded-3xl border border-dashed border-white/15 bg-white/[0.03] px-5 py-12 text-center text-sm text-white/50">
              Belum ada tim yang bergabung.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {board.map((entry) => {
                const rank = rankOf(entry.player.id)
                const progress =
                  entry.total > 0
                    ? Math.min(100, (entry.played / entry.total) * 100)
                    : 0
                return (
                  <div
                    key={entry.player.id}
                    className={cn(
                      'rounded-3xl border p-4 backdrop-blur transition',
                      rank === 1 && entry.correct > 0
                        ? 'border-amber-300/40 bg-amber-400/10'
                        : 'border-white/10 bg-white/5'
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-extrabold text-white">
                          {entry.player.nickname}
                        </p>
                        <p className="mt-0.5 text-xs text-white/45">
                          Tim #{(entry.player.team_index ?? 0) + 1} ·{' '}
                          {entry.total} kata
                        </p>
                        {entry.composition.length > 1 && (
                          <p className="mt-1 text-[11px] leading-relaxed text-white/35">
                            {entry.composition
                              .map((item) => `${item.count} ${item.category}`)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                      <span
                        className={cn(
                          'shrink-0 rounded-xl px-2.5 py-1 font-display text-sm font-bold',
                          rank === 1 && entry.correct > 0
                            ? 'bg-amber-400 text-amber-950'
                            : 'bg-white/10 text-white/70'
                        )}
                      >
                        #{rank}
                      </span>
                    </div>

                    <div className="mt-3 flex items-end justify-between">
                      <div>
                        <p className="font-display text-3xl font-extrabold leading-none text-emerald-300">
                          {entry.correct}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                          kata benar
                        </p>
                      </div>
                      <p className="text-xs font-semibold text-white/50">
                        {entry.played} / {entry.total} dimainkan
                      </p>
                    </div>

                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-violet-400 transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {entry.exhausted && (
                      <p className="mt-2 text-[11px] font-semibold text-emerald-300/80">
                        ✓ selesai — menunggu tim lain
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          Layar ini untuk host. Pemain hanya melihat kata &amp; tombol
          Benar/Lewati di HP masing-masing.
        </p>
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
