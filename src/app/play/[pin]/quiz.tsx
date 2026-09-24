'use client'

import { Answer, Choice, Question } from '@/types/types'
import { ANSWER_STYLES } from '@/constants'
import { cn, formatNumber } from '@/lib/utils'
import { AnswerShape, CheckIcon, CountdownRing, CrossIcon } from '@/components/game-ui'

export function PlayerQuiz({
  question,
  index,
  total,
  isAnswerRevealed,
  myAnswer,
  totalScore,
  nickname,
  submitting,
  onAnswer,
}: {
  question: Question
  index: number
  total: number
  isAnswerRevealed: boolean
  myAnswer: Answer | null
  totalScore: number
  nickname: string
  submitting: boolean
  onAnswer: (choice: Choice, elapsedMs: number) => void
}) {
  const chosenId = myAnswer?.choice_id ?? null
  const correctIds = question.choices
    .filter((choice) => choice.is_correct)
    .map((choice) => choice.id)
  const isCorrect = chosenId ? correctIds.includes(chosenId) : false

  return (
    <div className="flex min-h-screen flex-col bg-slate-950">
      {/* Bar atas */}
      <div className="flex items-center justify-between gap-3 border-b border-white/5 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-white/40">
            {nickname}
          </p>
          <p className="font-display text-lg font-extrabold text-white">
            Soal {index + 1}
            <span className="text-white/35"> / {total}</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
              Poin
            </p>
            <p className="font-display text-lg font-extrabold tabular-nums text-violet-300">
              {formatNumber(totalScore)}
            </p>
          </div>
          <CountdownRing
            durationMs={question.time_limit * 1000}
            startKey={question.id}
            size={64}
            tone="dark"
          />
        </div>
      </div>

      {/* Soal */}
      <div className="px-4 pt-5 sm:px-6">
        {question.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.image_url}
            alt=""
            className="mx-auto mb-4 max-h-44 w-auto rounded-2xl object-contain sm:max-h-56"
          />
        )}
        <h2 className="animate-slide-up rounded-2xl bg-white px-5 py-5 text-center font-display text-lg font-extrabold leading-snug text-slate-900 shadow-xl sm:text-2xl">
          {question.body}
        </h2>
      </div>

      {/* Jawaban */}
      <div className="grid flex-1 grid-cols-1 content-start gap-2.5 p-4 sm:grid-cols-2 sm:gap-3 sm:p-6">
        {question.choices.map((choice, choiceIndex) => {
          const style = ANSWER_STYLES[choiceIndex % ANSWER_STYLES.length]
          const isChosen = chosenId === choice.id
          const isRight = correctIds.includes(choice.id)
          const showResult = isAnswerRevealed || Boolean(chosenId)

          return (
            <button
              key={choice.id}
              type="button"
              disabled={Boolean(chosenId) || isAnswerRevealed || submitting}
              onClick={() => onAnswer(choice, Date.now())}
              className={cn(
                'group relative flex min-h-[76px] w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all duration-200 sm:min-h-[92px] sm:px-5',
                style.bg,
                'text-white shadow-lg',
                !chosenId && !isAnswerRevealed && 'active:scale-[0.98] hover:brightness-110',
                showResult && !isChosen && !isRight && 'opacity-35 saturate-50',
                showResult && isRight && 'ring-4 ring-white/80',
                showResult && isChosen && !isRight && 'ring-4 ring-slate-900/40'
              )}
            >
              <AnswerShape index={choiceIndex} className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="flex-1 font-display text-base font-bold leading-snug sm:text-lg">
                {choice.body}
              </span>
              {showResult && isRight && <CheckIcon className="h-6 w-6" />}
              {showResult && isChosen && !isRight && <CrossIcon className="h-6 w-6" />}
            </button>
          )
        })}
      </div>

      {/* Status bawah */}
      <div className="safe-bottom sticky bottom-0 border-t border-white/5 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
        {!chosenId && !isAnswerRevealed && (
          <p className="text-center text-sm font-medium text-white/50">
            Tap salah satu jawaban secepat mungkin ⚡
          </p>
        )}

        {chosenId && !isAnswerRevealed && (
          <p className="text-center text-sm font-semibold text-white/70">
            Jawaban terkirim! Menunggu pemain lain…
          </p>
        )}

        {isAnswerRevealed && (
          <div className="flex items-center justify-center gap-3 text-center">
            <span
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                isCorrect ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
              )}
            >
              {isCorrect ? <CheckIcon /> : <CrossIcon />}
            </span>
            <div className="text-left">
              <p className="font-display text-base font-extrabold text-white">
                {isCorrect ? 'Benar!' : chosenId ? 'Kurang tepat' : 'Tidak menjawab'}
              </p>
              <p className="text-xs text-white/60">
                {isCorrect
                  ? `+${formatNumber(myAnswer?.score ?? 0)} poin`
                  : 'Semangat, masih ada soal berikutnya 💪'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
