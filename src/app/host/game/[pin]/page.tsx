'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HostLobby } from './lobby'
import { HostQuiz } from './quiz'
import { HostResults } from './results'
import {
  Answer,
  Game,
  GameResult,
  Participant,
  Question,
  QuizSet,
  supabase,
} from '@/types/types'
import {
  applyScores,
  backToLobby,
  finishGame,
  getAnswersForQuestion,
  getGameByPin,
  getGameResults,
  getParticipants,
  goToQuestion,
  resetGameAnswers,
  setAnswerRevealed,
  startQuiz,
} from '@/lib/game'
import { getQuizSet } from '@/lib/quiz'
import { useSession } from '@/lib/use-session'
import { isTextAnswerCorrect, scoreForAnswer } from '@/lib/utils'
import { Alert, ButtonLink, Logo, Spinner } from '@/components/ui'

export default function HostGamePage({ params }: { params: { pin: string } }) {
  const pin = params.pin
  const router = useRouter()
  const { ready, userId, error: sessionError } = useSession()

  const [game, setGame] = useState<Game | null>(null)
  const [quiz, setQuiz] = useState<QuizSet | null>(null)
  const [players, setPlayers] = useState<Participant[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [leaderboard, setLeaderboard] = useState<GameResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const gameRef = useRef<Game | null>(null)
  const quizRef = useRef<QuizSet | null>(null)
  const revealedRef = useRef(false)
  /** Soal mana yang datanya sedang ada di `answers`. */
  const answersQuestionRef = useRef<string | null>(null)

  gameRef.current = game
  quizRef.current = quiz

  const gameId = game?.id
  const sequence = game?.current_question_sequence ?? 0
  const currentQuestion = quiz?.questions[sequence] ?? null
  const currentQuestionId = currentQuestion?.id ?? null

  /* ------------------------------ Muat data -------------------------------- */
  useEffect(() => {
    if (!ready) return
    if (!userId) {
      setError(
        sessionError ??
          'Gagal menyiapkan sesi host. Periksa konfigurasi Supabase Anda.'
      )
      setLoading(false)
      return
    }

    let alive = true

    const init = async () => {
      try {
        const found = await getGameByPin(pin)
        if (!alive) return
        if (!found) {
          setError('Ruangan dengan PIN ini tidak ditemukan.')
          setLoading(false)
          return
        }
        if (found.host_user_id && found.host_user_id !== userId) {
          setError(
            'Anda bukan host ruangan ini. Minta PIN baru dari host yang membuatnya.'
          )
          setLoading(false)
          return
        }

        const loadedQuiz = await getQuizSet(found.quiz_set_id)
        if (!alive) return
        if (!loadedQuiz) {
          setError('Kuis untuk ruangan ini tidak ditemukan.')
          setLoading(false)
          return
        }

        setGame(found)
        setQuiz(loadedQuiz)
        setPlayers(await getParticipants(found.id))
        setLeaderboard(await getGameResults(found.id))
        setLoading(false)
      } catch (caught) {
        if (!alive) return
        setError(caught instanceof Error ? caught.message : 'Gagal memuat ruangan')
        setLoading(false)
      }
    }

    init()
    return () => {
      alive = false
    }
  }, [ready, userId, pin, sessionError])

  /* --------------------------- Sinkronisasi game --------------------------- */
  useEffect(() => {
    if (!gameId) return
    let alive = true

    const interval = window.setInterval(async () => {
      try {
        const fresh = await getGameByPin(pin)
        if (!alive || !fresh) return
        setGame((current) =>
          current &&
          current.phase === fresh.phase &&
          current.current_question_sequence === fresh.current_question_sequence &&
          current.is_answer_revealed === fresh.is_answer_revealed
            ? current
            : fresh
        )
      } catch {
        /* abaikan */
      }
    }, 5000)

    return () => {
      alive = false
      window.clearInterval(interval)
    }
  }, [gameId, pin])

  /* ------------------------------ Pemain live ------------------------------ */
  useEffect(() => {
    if (!gameId) return
    let alive = true

    const load = async () => {
      try {
        const rows = await getParticipants(gameId)
        if (alive) setPlayers(rows)
      } catch {
        /* abaikan */
      }
    }

    const channel = supabase
      .channel(`host-players-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'participants',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (!alive) return
          const joined = payload.new as Participant
          setPlayers((current) =>
            current.some((player) => player.id === joined.id)
              ? current
              : [...current, joined]
          )
        }
      )
      .subscribe()

    const interval = window.setInterval(load, 4000)

    return () => {
      alive = false
      supabase.removeChannel(channel)
      window.clearInterval(interval)
    }
  }, [gameId])

  /* ----------------------------- Jawaban live ------------------------------ */
  useEffect(() => {
    // Kosongkan dulu supaya hitungan soal baru tidak memakai data soal lama.
    answersQuestionRef.current = null
    setAnswers([])

    if (!currentQuestionId) return
    let alive = true

    const load = async () => {
      try {
        const rows = await getAnswersForQuestion(currentQuestionId)
        if (!alive) return
        answersQuestionRef.current = currentQuestionId
        setAnswers(rows)
      } catch {
        /* abaikan */
      }
    }

    load()

    const channel = supabase
      .channel(`host-answers-${currentQuestionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${currentQuestionId}`,
        },
        (payload) => {
          if (!alive) return
          const incoming = payload.new as Answer
          setAnswers((current) =>
            current.some((answer) => answer.id === incoming.id)
              ? current
              : [...current, incoming]
          )
        }
      )
      .subscribe()

    const interval = window.setInterval(load, 3000)

    return () => {
      alive = false
      supabase.removeChannel(channel)
      window.clearInterval(interval)
    }
  }, [currentQuestionId])

  /* -------------------------- Buka jawaban + skor -------------------------- */
  const revealAndScore = useCallback(async () => {
    const current = gameRef.current
    const question = quizRef.current?.questions[current?.current_question_sequence ?? 0]
    if (!current || !question || current.is_answer_revealed || revealedRef.current) {
      return
    }

    revealedRef.current = true
    setBusy(true)
    try {
      setGame({ ...current, is_answer_revealed: true })
      await setAnswerRevealed(current.id, true)

      const rows = await getAnswersForQuestion(question.id)
      setAnswers(rows)

      if (rows.length > 0) {
        await applyScores(
          rows.map((row) => ({
            answerId: row.id,
            score: scoreForAnswer({
              isCorrect: isAnswerCorrect(question, row),
              elapsedMs: row.time_taken_ms ?? 0,
              timeLimitSec: question.time_limit,
              points: question.points,
            }),
          }))
        )
      }

      setLeaderboard(await getGameResults(current.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal membuka jawaban')
    } finally {
      setBusy(false)
    }
  }, [])

  // Reset penjaga saat soal berganti.
  useEffect(() => {
    revealedRef.current = false
  }, [sequence, game?.phase])

  // Kalau semua pemain sudah menjawab, buka jawaban otomatis.
  useEffect(() => {
    if (!game || game.phase !== 'quiz' || game.is_answer_revealed) return
    if (!currentQuestionId) return
    // Pastikan `answers` benar-benar milik soal yang sedang tampil.
    if (answersQuestionRef.current !== currentQuestionId) return
    if (players.length === 0) return
    if (answers.length >= players.length) void revealAndScore()
  }, [
    answers.length,
    players.length,
    game,
    currentQuestionId,
    revealAndScore,
  ])

  /* -------------------------------- Aksi ----------------------------------- */
  const handleStart = async () => {
    const current = gameRef.current
    if (!current) return
    setBusy(true)
    try {
      await startQuiz(current.id)
      setGame({
        ...current,
        phase: 'quiz',
        current_question_sequence: 0,
        is_answer_revealed: false,
      })
      setLeaderboard(await getGameResults(current.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal memulai')
    } finally {
      setBusy(false)
    }
  }

  const handleNext = async () => {
    const current = gameRef.current
    const loadedQuiz = quizRef.current
    if (!current || !loadedQuiz) return

    const isLast = current.current_question_sequence >= loadedQuiz.questions.length - 1
    setBusy(true)
    try {
      if (isLast) {
        await finishGame(current.id)
        setGame({ ...current, phase: 'result' })
      } else {
        const next = current.current_question_sequence + 1
        await goToQuestion(current.id, next)
        setGame({
          ...current,
          current_question_sequence: next,
          is_answer_revealed: false,
        })
      }
      setLeaderboard(await getGameResults(current.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal lanjut')
    } finally {
      setBusy(false)
    }
  }

  const handleFinish = async () => {
    const current = gameRef.current
    if (!current) return
    setBusy(true)
    try {
      await finishGame(current.id)
      setGame({ ...current, phase: 'result' })
      setLeaderboard(await getGameResults(current.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengakhiri')
    } finally {
      setBusy(false)
    }
  }

  const handleReplay = async () => {
    const current = gameRef.current
    if (!current) return
    setBusy(true)
    try {
      await resetGameAnswers(current.id)
      await backToLobby(current.id)
      setGame({
        ...current,
        phase: 'lobby',
        current_question_sequence: 0,
        is_answer_revealed: false,
      })
      setAnswers([])
      setLeaderboard([])
      setPlayers(await getParticipants(current.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengulang')
    } finally {
      setBusy(false)
    }
  }

  /* ------------------------------- Render ---------------------------------- */
  if (loading || !ready) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-950">
        <Logo tone="light" />
        <Spinner className="h-8 w-8 text-white/60" />
      </div>
    )
  }

  if (error && !game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md">
          <Logo tone="light" className="mb-6" />
          <Alert tone="error">{error}</Alert>
          <ButtonLink href="/host/dashboard" block size="lg" className="mt-5">
            Kembali ke dashboard
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (!game || !quiz) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Spinner className="h-8 w-8 text-white/60" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md">
          <Alert tone="error">{error}</Alert>
          <ButtonLink href="/host/dashboard" block size="lg" className="mt-5">
            Kembali ke dashboard
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (game.phase === 'lobby') {
    return (
      <HostLobby
        pin={pin}
        quizName={quiz.name}
        totalQuestions={quiz.questions.length}
        players={players}
        starting={busy}
        onStart={handleStart}
      />
    )
  }

  if (game.phase === 'result') {
    return (
      <HostResults
        gameId={game.id}
        quizName={quiz.name}
        replaying={busy}
        onReplay={handleReplay}
        onExit={() => router.push('/')}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md text-center">
          <Alert tone="warning">
            Soal nomor {sequence + 1} tidak ditemukan. Kuis ini mungkin sudah
            diubah setelah ruangan dibuat.
          </Alert>
          <ButtonLink href="/host/dashboard" block size="lg" className="mt-5">
            Kembali ke dashboard
          </ButtonLink>
        </div>
      </div>
    )
  }

  return (
    <HostQuiz
      pin={pin}
      question={currentQuestion}
      index={sequence}
      total={quiz.questions.length}
      players={players}
      answers={answers}
      revealed={game.is_answer_revealed}
      scoring={busy}
      leaderboard={leaderboard}
      isLast={sequence >= quiz.questions.length - 1}
      onReveal={revealAndScore}
      onNext={handleNext}
      onFinish={handleFinish}
    />
  )
}

/**
 * Menentukan sebuah jawaban benar atau salah.
 *
 * - Soal pilihan ganda: cek `is_correct` pada pilihan yang dipilih pemain.
 * - Soal "jawaban diketik": bandingkan teks yang diketik dengan kunci jawaban.
 *
 * Perbandingan teks mengabaikan spasi berlebih dan (kecuali `text_exact`
 * diaktifkan) mengabaikan huruf besar/kecil.
 */
function isAnswerCorrect(question: Question, answer: Answer) {
  if (question.question_type === 'text') {
    return isTextAnswerCorrect({
      given: answer.free_text,
      key: question.text_answer,
      exact: question.text_exact,
    })
  }

  return (
    question.choices.find((choice) => choice.id === answer.choice_id)
      ?.is_correct ?? false
  )
}
