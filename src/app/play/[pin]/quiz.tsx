'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Answer, Choice, Question } from '@/types/types'
import { ANSWER_STYLES, MAX_TEXT_ANSWER_LENGTH } from '@/constants'
import { cn, formatNumber, isTextAnswerCorrect } from '@/lib/utils'
import {
  AnswerShape,
  CheckIcon,
  CountdownRing,
  CrossIcon,
} from '@/components/game-ui'

export function PlayerQuiz({
  question,
  index,
  total,
  isAnswerRevealed,
  myAnswer,
  totalScore,
  nickname,
  submitting,
  onAnswerChoice,
  onAnswerText,
}: {
  question: Question
  index: number
  total: number
  isAnswerRevealed: boolean
  myAnswer: Answer | null
  totalScore: number
  nickname: string
  submitting: boolean
  onAnswerChoice: (choice: Choice, answeredAt: number) => void
  onAnswerText: (text: string, answeredAt: number) => void
}) {
  const isTextQuestion = question.question_type === 'text'
  const chosenId = myAnswer?.choice_id ?? null
  const correctIds = question.choices
    .filter((choice) => choice.is_correct)
    .map((choice) => choice.id)

  const isCorrect = isTextQuestion
    ? isTextAnswerCorrect({
        given: myAnswer?.free_text,
        key: question.text_answer,
        exact: question.text_exact,
      })
    : chosenId
      ? correctIds.includes(chosenId)
      : false

  const hasAnswered = Boolean(myAnswer)

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
        {isTextQuestion && !isAnswerRevealed && !hasAnswered && (
          <p className="mt-3 text-center text-xs font-semibold uppercase tracking-wider text-violet-300">
            Ketik jawabanmu
          </p>
        )}
      </div>

      {/* Area jawaban */}
      {isTextQuestion ? (
        <TextAnswerArea
          question={question}
          myAnswer={myAnswer}
          isAnswerRevealed={isAnswerRevealed}
          isCorrect={isCorrect}
          submitting={submitting}
          onSubmit={onAnswerText}
        />
      ) : (
        <div className="grid flex-1 grid-cols-1 content-start gap-2.5 p-4 sm:grid-cols-2 sm:gap-3 sm:p-6">
          {question.choices.map((choice, choiceIndex) => {
            const style = ANSWER_STYLES[choiceIndex % ANSWER_STYLES.length]
            const isChosen = chosenId === choice.id
            const isRight = correctIds.includes(choice.id)
            const showResult = isAnswerRevealed || hasAnswered

            return (
              <button
                key={choice.id}
                type="button"
                disabled={hasAnswered || isAnswerRevealed || submitting}
                onClick={() => onAnswerChoice(choice, Date.now())}
                className={cn(
                  'group relative flex min-h-[76px] w-full items-center gap-3 rounded-2xl px-4 py-4 text-left transition-all duration-200 sm:min-h-[92px] sm:px-5',
                  style.bg,
                  'text-white shadow-lg',
                  !hasAnswered &&
                    !isAnswerRevealed &&
                    'active:scale-[0.98] hover:brightness-110',
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
                {showResult && isChosen && !isRight && (
                  <CrossIcon className="h-6 w-6" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Status bawah */}
      <div className="safe-bottom sticky bottom-0 border-t border-white/5 bg-slate-950/90 px-4 py-3 backdrop-blur sm:px-6">
        {!hasAnswered && !isAnswerRevealed && !isTextQuestion && (
          <p className="text-center text-sm font-medium text-white/50">
            Tap salah satu jawaban secepat mungkin ⚡
          </p>
        )}

        {hasAnswered && !isAnswerRevealed && (
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
                {isCorrect
                  ? 'Benar!'
                  : hasAnswered
                    ? 'Kurang tepat'
                    : 'Tidak menjawab'}
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

/* -------------------------------------------------------------------------- */
/*  Jawaban yang diketik                                                      */
/* -------------------------------------------------------------------------- */

function TextAnswerArea({
  question,
  myAnswer,
  isAnswerRevealed,
  isCorrect,
  submitting,
  onSubmit,
}: {
  question: Question
  myAnswer: Answer | null
  isAnswerRevealed: boolean
  isCorrect: boolean
  submitting: boolean
  onSubmit: (text: string, answeredAt: number) => void
}) {
  const [text, setText] = useState('')

  useEffect(() => {
    setText('')
  }, [question.id])

  const locked = Boolean(myAnswer) || isAnswerRevealed || submitting

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (locked) return
    const value = text.trim()
    if (value.length === 0) return
    onSubmit(value, Date.now())
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-lg">
        {isAnswerRevealed ? (
          <div className="animate-pop space-y-3">
            <div
              className={cn(
                'rounded-2xl border px-5 py-4 text-center',
                isCorrect
                  ? 'border-emerald-400/30 bg-emerald-500/10'
                  : 'border-rose-400/30 bg-rose-500/10'
              )}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Jawabanmu
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-white">
                {myAnswer?.free_text ?? '— tidak dijawab —'}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Kunci jawaban
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-emerald-300">
                {question.text_answer ?? '—'}
              </p>
              {question.text_exact && (
                <p className="mt-1 text-[11px] text-white/40">
                  Wajib sama persis (peka huruf besar/kecil)
                </p>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="animate-pop">
            <input
              value={text}
              onChange={(event) =>
                setText(event.target.value.slice(0, MAX_TEXT_ANSWER_LENGTH))
              }
              disabled={locked}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              placeholder="Ketik jawabanmu…"
              className={cn(
                'h-16 w-full rounded-2xl border bg-white/10 px-5 text-center',
                'font-display text-xl font-bold text-white',
                'placeholder:text-white/30 focus:outline-none focus:ring-4',
                locked
                  ? 'border-white/10 opacity-60'
                  : 'border-white/20 focus:border-violet-400 focus:ring-violet-500/20'
              )}
            />

            <button
              type="submit"
              disabled={locked || text.trim().length === 0}
              className={cn(
                'mt-4 h-14 w-full rounded-2xl font-semibold tracking-tight transition',
                'bg-violet-600 text-white shadow-lg shadow-violet-600/25',
                'hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40'
              )}
            >
              {submitting ? 'Mengirim…' : 'Kirim jawaban'}
            </button>

            <p className="mt-3 text-center text-xs text-white/40">
              Tekan Enter untuk mengirim · {text.length}/{MAX_TEXT_ANSWER_LENGTH}
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
