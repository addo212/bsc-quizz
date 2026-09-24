'use client'

import { Answer, GameResult, Participant, Question } from '@/types/types'
import { ANSWER_STYLES } from '@/constants'
import { cn, formatNumber } from '@/lib/utils'
import { AnswerShape, CheckIcon, CountdownRing } from '@/components/game-ui'
import { Avatar } from '@/components/player-chip'
import { Badge, Button } from '@/components/ui'

export function HostQuiz({
  pin,
  question,
  index,
  total,
  players,
  answers,
  revealed,
  scoring,
  leaderboard,
  isLast,
  onReveal,
  onNext,
  onFinish,
}: {
  pin: string
  question: Question
  index: number
  total: number
  players: Participant[]
  answers: Answer[]
  revealed: boolean
  scoring: boolean
  leaderboard: GameResult[]
  isLast: boolean
  onReveal: () => void
  onNext: () => void
  onFinish: () => void
}) {
  const counts = question.choices.map(
    (choice) => answers.filter((answer) => answer.choice_id === choice.id).length
  )
  const maxCount = Math.max(1, ...counts)
  const answeredRatio = players.length > 0 ? answers.length / players.length : 0

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-white/10 px-3 py-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              PIN
            </p>
            <p className="font-display text-sm font-extrabold tracking-[0.2em] text-white">
              {pin}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Soal
            </p>
            <p className="font-display text-lg font-extrabold text-white">
              {index + 1}
              <span className="text-white/30"> / {total}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Jawaban masuk
            </p>
            <p className="font-display text-lg font-extrabold tabular-nums text-white">
              {answers.length}
              <span className="text-white/30"> / {players.length}</span>
            </p>
          </div>
          {!revealed && (
            <CountdownRing
              durationMs={question.time_limit * 1000}
              startKey={question.id}
              size={68}
              tone="dark"
              onComplete={onReveal}
            />
          )}
          {revealed && (
            <Badge tone="emerald" className="!bg-emerald-500/15 !px-3 !py-1.5 !text-sm !text-emerald-300">
              Jawaban dibuka
            </Badge>
          )}
        </div>
      </div>

      {/* Progress bar jawaban */}
      <div className="h-1 w-full bg-white/5">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
          style={{ width: `${Math.round(answeredRatio * 100)}%` }}
        />
      </div>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_20rem] lg:gap-8">
        {/* Soal & pilihan */}
        <div className="min-w-0">
          {question.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={question.image_url}
              alt=""
              className="mx-auto mb-5 max-h-56 w-auto rounded-2xl object-contain sm:max-h-72"
            />
          )}

          <h2 className="animate-slide-up rounded-3xl bg-white px-6 py-7 text-center font-display text-xl font-extrabold leading-snug text-slate-900 shadow-2xl sm:px-10 sm:py-9 sm:text-3xl">
            {question.body}
          </h2>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {question.choices.map((choice, choiceIndex) => {
              const style = ANSWER_STYLES[choiceIndex % ANSWER_STYLES.length]
              const count = counts[choiceIndex]
              const isRight = choice.is_correct
              return (
                <div
                  key={choice.id}
                  className={cn(
                    'relative overflow-hidden rounded-2xl px-4 py-5 text-white shadow-lg sm:px-5 sm:py-6',
                    style.bg,
                    revealed && !isRight && 'opacity-45 saturate-50',
                    revealed && isRight && 'ring-4 ring-white/70'
                  )}
                >
                  {revealed && (
                    <div
                      className="absolute inset-y-0 left-0 bg-black/25 transition-all duration-700"
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  )}
                  <div className="relative flex items-center gap-3">
                    <AnswerShape index={choiceIndex} className="h-5 w-5 shrink-0" />
                    <span className="flex-1 font-display text-lg font-extrabold leading-snug sm:text-xl">
                      {choice.body}
                    </span>
                    {revealed && (
                      <span className="flex items-center gap-2">
                        {isRight && <CheckIcon className="h-6 w-6" />}
                        <span className="font-display text-2xl font-extrabold tabular-nums">
                          {count}
                        </span>
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Panel kanan */}
        <aside className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Papan skor sementara
            </p>
            <ol className="space-y-2">
              {leaderboard.length === 0 && (
                <li className="text-sm text-white/40">
                  Belum ada skor. Skor dihitung setelah jawaban dibuka.
                </li>
              )}
              {leaderboard.slice(0, 8).map((row, rowIndex) => (
                <li
                  key={row.participant_id}
                  className="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2"
                >
                  <span className="w-5 text-center text-xs font-bold text-white/50">
                    {rowIndex + 1}
                  </span>
                  <Avatar name={row.nickname ?? '?'} size="sm" />
                  <span className="flex-1 truncate text-sm font-semibold text-white">
                    {row.nickname}
                  </span>
                  <span className="font-display text-sm font-extrabold tabular-nums text-violet-200">
                    {formatNumber(row.total_score ?? 0)}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Sudah menjawab ({answers.length}/{players.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {players.map((player) => {
                const answered = answers.some(
                  (answer) => answer.participant_id === player.id
                )
                return (
                  <span
                    key={player.id}
                    className={cn(
                      'rounded-lg px-2 py-1 text-xs font-semibold transition',
                      answered
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-white/5 text-white/40'
                    )}
                  >
                    {player.nickname}
                  </span>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Aksi bawah */}
      <div className="safe-bottom sticky bottom-0 border-t border-white/5 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <p className="hidden text-xs text-white/40 sm:block">
            {revealed
              ? 'Bahas jawaban bersama pemain, lalu lanjut ke soal berikutnya.'
              : 'Host juga bisa membuka jawaban lebih cepat sebelum waktu habis.'}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onFinish}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-white/45 transition hover:bg-white/10 hover:text-white"
            >
              Akhiri permainan
            </button>
            {!revealed ? (
              <Button
                variant="dark"
                size="lg"
                onClick={onReveal}
                loading={scoring}
              >
                Tampilkan jawaban
              </Button>
            ) : (
              <Button size="lg" onClick={onNext} loading={scoring}>
                {isLast ? 'Lihat hasil akhir' : 'Soal berikutnya →'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
