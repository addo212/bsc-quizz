'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlayerLobby } from './lobby'
import { PlayerQuiz } from './quiz'
import { PlayerCharades } from './charades'
import { PlayerResults } from './results'
import {
  Answer,
  Choice,
  Game,
  Participant,
  Question,
  supabase,
} from '@/types/types'
import {
  fetchGameQuestions,
  findMyParticipant,
  getGameByPin,
  getGameById,
  getMyAnswers,
  getParticipants,
  markCharadeWord,
  submitAnswer,
} from '@/lib/game'
import { useSession } from '@/lib/use-session'
import { CHARADE_POINT } from '@/constants'
import { Alert, Button, ButtonLink, FullPageLoader, Logo } from '@/components/ui'

export default function PlayPage({ params }: { params: { pin: string } }) {
  const pin = params.pin
  const router = useRouter()
  const { ready, userId, error: sessionError } = useSession()

  const [game, setGame] = useState<Game | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [playerCount, setPlayerCount] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const gameRef = useRef<Game | null>(null)
  const participantRef = useRef<Participant | null>(null)
  const questionsRef = useRef<Question[]>([])
  const quizSetIdRef = useRef<string | null>(null)
  const questionStartedAtRef = useRef<number>(Date.now())

  gameRef.current = game
  participantRef.current = participant
  questionsRef.current = questions

  /* ------------------------------ 1. Muat data ----------------------------- */
  useEffect(() => {
    if (!ready) return
    if (!userId) {
      setError(sessionError ?? 'Gagal menyiapkan sesi pemain.')
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

        const me = await findMyParticipant(found.id, userId)
        if (!alive) return
        if (!me) {
          router.replace(`/join?pin=${pin}`)
          return
        }

        quizSetIdRef.current = found.quiz_set_id
        setGame(found)
        setParticipant(me)

        const loaded = await fetchGameQuestions(found.id, found.quiz_set_id)
        if (!alive) return
        setQuestions(loaded)
        setLoading(false)
      } catch (caught) {
        if (!alive) return
        setError(
          caught instanceof Error ? caught.message : 'Gagal memuat permainan.'
        )
        setLoading(false)
      }
    }

    init()
    return () => {
      alive = false
    }
  }, [ready, userId, pin, router, sessionError])

  /* --------------------------- 2. Realtime + fallback ---------------------- */
  const gameId = game?.id

  useEffect(() => {
    if (!gameId) return
    let alive = true

    const channel = supabase
      .channel(`game-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          if (alive) setGame(payload.new as Game)
        }
      )
      .subscribe()

    // Jaring pengaman kalau Realtime belum diaktifkan di project Supabase.
    const interval = window.setInterval(async () => {
      try {
        const fresh = await getGameById(gameId)
        if (alive && fresh) setGame((current) => (isSameGame(current, fresh) ? current : fresh))
      } catch {
        /* diamkan, coba lagi di interval berikutnya */
      }
    }, 3500)

    return () => {
      alive = false
      supabase.removeChannel(channel)
      window.clearInterval(interval)
    }
  }, [gameId])

  /* ------------------ 3. Ambil ulang soal saat jawaban dibuka -------------- */
  const revealKey = game
    ? `${game.current_question_sequence}-${game.is_answer_revealed}`
    : ''

  const reloadQuestions = useCallback(async () => {
    const current = gameRef.current
    const quizSetId = quizSetIdRef.current
    if (!current || !quizSetId) return
    try {
      const loaded = await fetchGameQuestions(current.id, quizSetId)
      setQuestions(loaded)
    } catch {
      /* biarkan soal lama tetap tampil */
    }
  }, [])

  useEffect(() => {
    if (!gameRef.current?.is_answer_revealed) return
    void reloadQuestions()
  }, [revealKey, reloadQuestions])

  /* --------------------- 4. Jumlah pemain di ruangan ----------------------- */
  useEffect(() => {
    if (!gameId) return
    let alive = true

    const load = async () => {
      try {
        const rows = await getParticipants(gameId)
        if (alive) setPlayerCount(rows.length)
      } catch {
        /* abaikan */
      }
    }

    load()
    const interval = window.setInterval(load, 5000)

    return () => {
      alive = false
      window.clearInterval(interval)
    }
  }, [gameId])

  /* --------------------- 5. Skor saya (dihitung oleh host) ----------------- */  useEffect(() => {
    const participantId = participant?.id
    if (!participantId) return
    let alive = true

    const load = async () => {
      try {
        const rows = await getMyAnswers(participantId)
        if (!alive) return
        setAnswers((current) =>
          mergeAnswers(
            Object.fromEntries(rows.map((row) => [row.question_id, row])),
            current
          )
        )
      } catch {
        /* abaikan */
      }
    }

    load()

    const channel = supabase
      .channel(`answers-${participantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'answers',
          filter: `participant_id=eq.${participantId}`,
        },
        () => void load()
      )
      .subscribe()

    const interval = window.setInterval(load, 5000)

    return () => {
      alive = false
      supabase.removeChannel(channel)
      window.clearInterval(interval)
    }
  }, [participant?.id])

  /**
   * Saat host mengembalikan permainan ke lobby (tombol "Main lagi"), buang
   * jawaban lama dari state. Kalau tidak, soal pertama di putaran berikutnya
   * dianggap sudah dijawab sehingga pemain tidak bisa menjawab lagi.
   */
  useEffect(() => {
    if (game?.phase === 'lobby') setAnswers({})
  }, [game?.phase])

  /**
   * Mode tebak kata: pembagian soal (`question_start` / `question_count`)
   * baru ditulis host saat menekan "Bagi soal & mulai", jadi baris peserta
   * harus dibaca ulang — kalau tidak, tim akan memutar seluruh daftar kata.
   */
  useEffect(() => {
    if (game?.mode !== 'charades' || !game?.id || !participant?.id || !userId) {
      return
    }

    const targetGameId = game.id
    let alive = true

    const load = async () => {
      try {
        const fresh = await findMyParticipant(targetGameId, userId)
        if (!alive || !fresh) return
        setParticipant((current) =>
          current &&
          current.team_index === fresh.team_index &&
          current.question_start === fresh.question_start &&
          current.question_count === fresh.question_count
            ? current
            : fresh
        )
      } catch {
        /* abaikan, coba lagi di interval berikutnya */
      }
    }

    const interval = window.setInterval(load, 4000)

    return () => {
      alive = false
      window.clearInterval(interval)
    }
  }, [game?.mode, game?.id, participant?.id, userId])

  /* ------------------------------ 5. Aksi ---------------------------------- */
  const currentQuestion = game
    ? questions[game.current_question_sequence] ?? null
    : null

  /**
   * Kunci unik per tampilan soal.
   *
   * Sengaja memakai `phase` + nomor soal, bukan hanya `question.id`. Alasannya:
   * saat masih di lobby, `questions[0]` sudah terbaca sehingga id soal pertama
   * sudah terisi. Kalau timer dipatok saat itu, soal pertama akan selalu
   * dihitung kehabisan waktu karena selisihnya diambil dari saat soal dimuat
   * (waktu lobby), bukan saat soal ditampilkan.
   */
  const questionKey =
    game && currentQuestion
      ? `${game.phase}:${game.current_question_sequence}:${currentQuestion.id}`
      : ''

  useEffect(() => {
    setNotice(null)
    // Timer jawaban hanya mulai saat soal benar-benar tampil.
    if (gameRef.current?.phase !== 'quiz') return
    questionStartedAtRef.current = Date.now()
  }, [questionKey])

  const myAnswer = currentQuestion ? answers[currentQuestion.id] ?? null : null

  const totalScore = Object.values(answers).reduce(
    (sum, row) => sum + (row.score ?? 0),
    0
  )

  /**
   * Mengirim jawaban pemain — dipakai untuk pilihan ganda maupun jawaban teks.
   * Tombol dikunci secara optimistis supaya terasa responsif.
   */
  const sendAnswer = async ({
    choiceId,
    freeText,
    answeredAt,
  }: {
    choiceId?: string
    freeText?: string
    answeredAt: number
  }) => {
    const current = gameRef.current
    const me = participantRef.current
    const question = currentQuestion
    if (!current || !me || !question || myAnswer || submitting) return

    // Batasi ke durasi soal supaya nilai ekstrem (mis. halaman di-refresh)
    // tidak membuat skor jatuh ke batas minimum.
    const elapsedMs = Math.min(
      question.time_limit * 1000,
      Math.max(0, answeredAt - questionStartedAtRef.current)
    )

    setSubmitting(true)
    // Optimistis: tombol langsung terkunci, tidak menunggu jaringan.
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        id: 'pending',
        created_at: new Date().toISOString(),
        participant_id: me.id,
        question_id: question.id,
        choice_id: choiceId ?? null,
        free_text: freeText?.trim() ? freeText.trim() : null,
        score: 0,
        time_taken_ms: elapsedMs,
      },
    }))

    try {
      await submitAnswer({
        participantId: me.id,
        questionId: question.id,
        choiceId: choiceId ?? null,
        freeText: freeText ?? null,
        timeTakenMs: elapsedMs,
      })
    } catch (caught) {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[question.id]
        return next
      })
      setNotice(
        caught instanceof Error
          ? `Jawaban gagal terkirim: ${caught.message}`
          : 'Jawaban gagal terkirim, coba lagi.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const handleAnswerChoice = (choice: Choice, answeredAt: number) => {
    void sendAnswer({ choiceId: choice.id, answeredAt })
  }

  const handleAnswerText = (text: string, answeredAt: number) => {
    void sendAnswer({ freeText: text, answeredAt })
  }

  /**
   * Mode tebak kata: pemegang HP menandai kata BENAR (+1) atau LEWATI (0).
   * Kata berikutnya langsung muncul secara optimistis, lalu disimpan di
   * belakang layar — jadi permainan tidak terasa tersendat.
   */
  const handleCharadeMark = async (
    question: Question,
    correct: boolean,
    elapsedMs: number
  ) => {
    const me = participantRef.current
    if (!me || submitting) return

    const timeTakenMs = Math.max(0, Math.round(elapsedMs))
    setSubmitting(true)
    setAnswers((prev) => ({
      ...prev,
      [question.id]: {
        id: 'pending',
        created_at: new Date().toISOString(),
        participant_id: me.id,
        question_id: question.id,
        choice_id: null,
        free_text: null,
        score: correct ? CHARADE_POINT : 0,
        time_taken_ms: timeTakenMs,
      },
    }))

    try {
      await markCharadeWord({
        participantId: me.id,
        questionId: question.id,
        correct,
        timeTakenMs,
      })
    } catch (caught) {
      setAnswers((prev) => {
        const next = { ...prev }
        delete next[question.id]
        return next
      })
      setNotice(
        caught instanceof Error
          ? `Gagal menyimpan: ${caught.message}`
          : 'Gagal menyimpan, coba lagi.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  /* ------------------------------- 6. Render -------------------------------- */
  if (!ready || loading) {
    return (
      <PageShell>
        <FullPageLoader label="Menyiapkan permainan…" />
      </PageShell>
    )
  }

  if (error || !game || !participant) {
    return (
      <PageShell>
        <div className="w-full max-w-sm">
          <Alert tone="error">{error ?? 'Terjadi kesalahan.'}</Alert>
          <div className="mt-5 flex flex-col gap-3">
            <ButtonLink href={`/join?pin=${pin}`} block size="lg">
              Coba gabung lagi
            </ButtonLink>
            <ButtonLink href="/" block size="lg" variant="dark">
              Kembali ke beranda
            </ButtonLink>
          </div>
        </div>
      </PageShell>
    )
  }

  if (notice) {
    return (
      <PageShell>
        <div className="w-full max-w-sm text-center">
          <Alert tone="error">{notice}</Alert>
          <Button
            className="mt-5"
            block
            size="lg"
            onClick={() => window.location.reload()}
          >
            Muat ulang halaman
          </Button>
        </div>
      </PageShell>
    )
  }

  if (game.phase === 'lobby') {
    return (
      <PlayerLobby
        participant={participant}
        pin={pin}
        playerCount={playerCount}
        totalQuestions={questions.length}
        connecting={!ready}
        charades={game.mode === 'charades'}
      />
    )
  }

  if (game.phase === 'result') {
    return (
      <PlayerResults
        gameId={game.id}
        participantId={participant.id}
        nickname={participant.nickname}
      />
    )
  }

  if (game.mode === 'charades') {
    return (
      <PlayerCharades
        game={game}
        participant={participant}
        questions={questions}
        answers={answers}
        totalScore={totalScore}
        submitting={submitting}
        onMark={handleCharadeMark}
      />
    )
  }

  if (!currentQuestion) {
    return (
      <PageShell>
        <FullPageLoader label="Memuat soal…" />
      </PageShell>
    )
  }

  return (
    <PlayerQuiz
      question={currentQuestion}
      index={game.current_question_sequence}
      total={questions.length}
      isAnswerRevealed={game.is_answer_revealed}
      myAnswer={myAnswer}
      totalScore={totalScore}
      nickname={participant.nickname}
      submitting={submitting}
      onAnswerChoice={handleAnswerChoice}
      onAnswerText={handleAnswerText}
    />
  )
}

/* -------------------------------------------------------------------------- */

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-10">
      <Logo tone="light" className="mb-8" />
      {children}
    </div>
  )
}

/** Hindari re-render tiap polling kalau isi game tidak berubah. */
function isSameGame(a: Game | null, b: Game) {
  if (!a) return false
  return (
    a.id === b.id &&
    a.phase === b.phase &&
    a.current_question_sequence === b.current_question_sequence &&
    a.is_answer_revealed === b.is_answer_revealed &&
    // Mode tebak kata memakai babak, bukan nomor soal.
    a.current_round === b.current_round &&
    a.round_started_at === b.round_started_at
  )
}

/** Pertahankan jawaban optimistis yang belum tersimpan di server. */
function mergeAnswers(
  fromServer: Record<string, Answer>,
  current: Record<string, Answer>
) {
  const merged = { ...fromServer }
  for (const [questionId, answer] of Object.entries(current)) {
    if (answer.id === 'pending' && !merged[questionId]) {
      merged[questionId] = answer
    }
  }
  return merged
}
