import { supabase, Answer, Game, GameMode, GameQuestion, GameResult, Participant, Question } from '@/types/types'
import { CHARADE_POINT } from '@/constants'
import { randomPin } from './utils'

/* -------------------------------------------------------------------------- */
/*  HOST: membuat & mengatur ruangan                                          */
/* -------------------------------------------------------------------------- */

/**
 * Membuat sesi permainan baru + PIN unik 6 digit.
 *
 * `mode` menentukan cara permainan dijalankan. Isinya diambil dari kuis
 * (`quiz_sets.game_mode`) supaya host tidak perlu memilih dua kali.
 *
 * Kolom `mode` hanya ditulis untuk mode tebak kata, jadi permainan klasik
 * tetap bisa dibuat walaupun `supabase/charades.sql` belum dijalankan.
 */
export async function createGame(
  quizSetId: string,
  mode: GameMode = 'classic'
): Promise<Game> {
  let lastError: string | null = null

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const pin = randomPin()
    const { data, error } = await supabase
      .from('games')
      .insert({
        quiz_set_id: quizSetId,
        pin,
        ...(mode === 'charades' ? { mode } : {}),
      })
      .select()
      .single()

    if (!error && data) return data
    lastError = error?.message ?? 'Gagal membuat ruangan'
    // 23505 = unique violation (PIN terpakai) -> coba PIN lain
    if (error?.code && error.code !== '23505') break
  }

  throw new Error(lastError ?? 'Gagal membuat ruangan')
}

export async function getGameByPin(pin: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select()
    .eq('pin', pin)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function getGameById(gameId: string): Promise<Game | null> {
  const { data, error } = await supabase
    .from('games')
    .select()
    .eq('id', gameId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

async function updateGame(gameId: string, patch: Partial<Game>) {
  const { error } = await supabase.from('games').update(patch).eq('id', gameId)
  if (error) throw new Error(error.message)
}

export function startQuiz(gameId: string) {
  return updateGame(gameId, {
    phase: 'quiz',
    current_question_sequence: 0,
    is_answer_revealed: false,
  })
}

export function goToQuestion(gameId: string, sequence: number) {
  return updateGame(gameId, {
    phase: 'quiz',
    current_question_sequence: sequence,
    is_answer_revealed: false,
  })
}

export function setAnswerRevealed(gameId: string, revealed: boolean) {
  return updateGame(gameId, { is_answer_revealed: revealed })
}

export function finishGame(gameId: string) {
  return updateGame(gameId, { phase: 'result' })
}

export function backToLobby(gameId: string) {
  return updateGame(gameId, {
    phase: 'lobby',
    current_question_sequence: 0,
    is_answer_revealed: false,
  })
}

/**
 * Bersihkan semua jawaban satu game supaya PIN yang sama bisa dimainkan ulang
 * tanpa pemain harus bergabung kembali.
 */
export async function resetGameAnswers(gameId: string) {
  const players = await getParticipants(gameId)
  if (players.length === 0) return

  const participantIds = players.map((player) => player.id)

  const { error } = await supabase
    .from('answers')
    .delete()
    .in('participant_id', participantIds)

  if (error) throw new Error(error.message)

  // Penting: kalau kebijakan RLS untuk host belum terpasang, PostgREST
  // melaporkan sukses padahal tidak menghapus apa pun. Cek sisa datanya
  // supaya pemain tidak "terkunci" karena jawaban lamanya masih ada.
  const { data: remaining } = await supabase
    .from('answers')
    .select('id')
    .in('participant_id', participantIds)

  if (remaining && remaining.length > 0) {
    throw new Error(
      `Gagal membersihkan ${remaining.length} jawaban lama. Jalankan ulang supabase/setup.sql di Supabase agar kebijakan "Host can reset answers" terpasang.`
    )
  }
}

/* -------------------------------------------------------------------------- */
/*  PEMAIN: gabung & menjawab                                                 */
/* -------------------------------------------------------------------------- */

export async function getParticipants(gameId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select()
    .eq('game_id', gameId)
    .order('created_at')

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function findMyParticipant(
  gameId: string,
  userId: string
): Promise<Participant | null> {
  const { data, error } = await supabase
    .from('participants')
    .select()
    .eq('game_id', gameId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function joinGame({
  gameId,
  userId,
  nickname,
}: {
  gameId: string
  userId: string
  nickname: string
}): Promise<Participant> {
  const existing = await findMyParticipant(gameId, userId)
  if (existing) return existing

  const { data: taken } = await supabase
    .from('participants')
    .select('id')
    .eq('game_id', gameId)
    .ilike('nickname', nickname.trim())

  if (taken && taken.length > 0) {
    throw new Error('Nama itu sudah dipakai pemain lain, coba nama lain ya.')
  }

  const { data, error } = await supabase
    .from('participants')
    .insert({ nickname: nickname.trim(), game_id: gameId, user_id: userId })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Pemain mengirim pilihan jawabannya.
 *
 * Skor sengaja TIDAK dihitung di sisi pemain (biar tidak bisa dicurangi).
 * Pemain hanya mengirim `time_taken_ms`; host yang menghitung dan menyimpan
 * poinnya saat jawaban di-reveal — lihat `applyScores`.
 */
export async function submitAnswer({
  participantId,
  questionId,
  choiceId,
  freeText,
  timeTakenMs,
}: {
  participantId: string
  questionId: string
  choiceId?: string | null
  freeText?: string | null
  timeTakenMs: number
}) {
  const { error } = await supabase.from('answers').insert({
    participant_id: participantId,
    question_id: questionId,
    choice_id: choiceId ?? null,
    free_text: freeText?.trim() ? freeText.trim() : null,
    score: 0,
    time_taken_ms: Math.max(0, Math.round(timeTakenMs)),
  })

  // 23505 = sudah menjawab soal ini; abaikan saja (klik ganda).
  if (error && error.code !== '23505') throw new Error(error.message)
}

/**
 * Host menuliskan skor akhir setiap jawaban setelah jawaban di-reveal.
 * Dipisah dari `submitAnswer` supaya kunci jawaban tidak pernah dikirim
 * ke device pemain sebelum waktunya.
 */
export async function applyScores(
  scores: { answerId: string; score: number }[]
) {
  const results = await Promise.all(
    scores.map((entry) =>
      supabase
        .from('answers')
        .update({ score: entry.score })
        .eq('id', entry.answerId)
    )
  )

  const failed = results.find((result) => result.error)
  if (failed?.error) {
    throw new Error(
      `Gagal menyimpan skor: ${failed.error.message}. Pastikan kebijakan RLS untuk host sudah dijalankan.`
    )
  }
}

/**
 * Jawaban untuk satu soal, **dibatasi hanya pemain di permainan ini**.
 *
 * Penting: satu soal dimiliki oleh *kuis*, dan kuis yang sama bisa dimainkan
 * berkali-kali (PIN berbeda). Kalau kueri hanya menyaring `question_id`,
 * jawaban dari permainan sebelumnya akan ikut terbaca — jumlah jawaban jadi
 * salah dan pemain lama ikut mendapat skor.
 */
export async function getAnswersForQuestion(
  questionId: string,
  participantIds: string[]
): Promise<Answer[]> {
  if (participantIds.length === 0) return []

  const { data, error } = await supabase
    .from('answers')
    .select()
    .eq('question_id', questionId)
    .in('participant_id', participantIds)

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getMyAnswer(
  participantId: string,
  questionId: string
): Promise<Answer | null> {
  const { data, error } = await supabase
    .from('answers')
    .select()
    .eq('participant_id', participantId)
    .eq('question_id', questionId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

/** Semua jawaban satu pemain — dipakai untuk menampilkan total skor live. */
export async function getMyAnswers(participantId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select()
    .eq('participant_id', participantId)

  if (error) throw new Error(error.message)
  return data ?? []
}

/**
 * Semua jawaban di satu permainan.
 *
 * Dipakai layar host mode tebak kata untuk menghitung skor tiap tim secara
 * langsung. Pemain tidak memakai ini — RLS membatasi mereka ke jawaban sendiri.
 */
export async function getAnswersForGame(gameId: string): Promise<Answer[]> {
  const players = await getParticipants(gameId)
  if (players.length === 0) return []

  const { data, error } = await supabase
    .from('answers')
    .select()
    .in(
      'participant_id',
      players.map((player) => player.id)
    )

  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getGameResults(gameId: string): Promise<GameResult[]> {
  const { data, error } = await supabase
    .from('game_results')
    .select()
    .eq('game_id', gameId)
    .order('total_score', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/* -------------------------------------------------------------------------- */
/*  SOAL UNTUK PEMAIN                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Pemain membaca soal lewat RPC `get_game_questions` (kunci jawaban
 * disembunyikan sampai reveal — lihat `supabase/hardening.sql`).
 * Kalau RPC belum dipasang, otomatis jatuh ke pembacaan tabel biasa.
 */
export async function fetchGameQuestions(
  gameId: string,
  quizSetId: string
): Promise<Question[]> {
  const { data, error } = await supabase.rpc('get_game_questions', {
    p_game_id: gameId,
  })

  if (!error && Array.isArray(data) && data.length > 0) {
    return (data as unknown as GameQuestion[]).map((question) => ({
      id: question.id,
      created_at: '',
      body: question.body,
      image_url: question.image_url,
      order: question.order,
      quiz_set_id: quizSetId,
      time_limit: question.time_limit ?? 20,
      points: question.points ?? 1000,
      question_type: question.question_type ?? 'choice',
      text_answer: question.text_answer ?? null,
      text_exact: question.text_exact ?? false,
      choices: (question.choices ?? []).map((choice) => ({
        id: choice.id,
        created_at: '',
        question_id: question.id,
        body: choice.body,
        is_correct: Boolean(choice.is_correct),
      })),
    }))
  }

  // Fallback: baca langsung dari tabel.
  const { data: rows, error: fallbackError } = await supabase
    .from('questions')
    .select('*, choices(*)')
    .eq('quiz_set_id', quizSetId)
    .order('order', { ascending: true })

  if (fallbackError) throw new Error(fallbackError.message)

  return (rows ?? []).map((question: any) => ({
    ...question,
    choices: (question.choices ?? []).slice().sort((a: any, b: any) =>
      a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
    ),
  })) as Question[]
}

/* -------------------------------------------------------------------------- */
/*  MODE TEBAK KATA (charades)                                                */
/*                                                                            */
/*  Alur: satu tim = satu HP (biasanya 2 orang, 1 memperagakan / 1 menebak).   */
/*  Semua tim bermain serentak dalam babak berdurasi tetap, dan tiap tim      */
/*  mendapat POTONGAN SOAL SENDIRI sehingga tidak ada kata yang sama.         */
/* -------------------------------------------------------------------------- */

/**
 * Bagi soal rata ke sejumlah tim tanpa tumpang tindih.
 *
 * Sisa pembagian diberikan ke tim urutan awal, jadi totalnya selalu utuh:
 * 15 soal / 4 tim => 4, 4, 4, 3.
 */
export function splitQuestionsForTeams(totalQuestions: number, teamCount: number) {
  if (teamCount <= 0) return [] as { start: number; count: number }[]

  const base = Math.floor(totalQuestions / teamCount)
  const remainder = totalQuestions % teamCount
  const slices: { start: number; count: number }[] = []

  let offset = 0
  for (let index = 0; index < teamCount; index += 1) {
    const count = base + (index < remainder ? 1 : 0)
    slices.push({ start: offset, count })
    offset += count
  }

  return slices
}

/**
 * Bagikan potongan soal ke tiap tim lalu mulai babak pertama.
 * Dipanggil host dari lobby dengan tombol "Bagi soal & mulai".
 */
export async function startCharadesGame({
  gameId,
  totalQuestions,
  roundTimeLimit,
}: {
  gameId: string
  totalQuestions: number
  roundTimeLimit: number
}) {
  const teams = await getParticipants(gameId)

  if (teams.length === 0) {
    throw new Error('Belum ada tim yang bergabung.')
  }
  if (totalQuestions < teams.length) {
    throw new Error(
      `Jumlah soal (${totalQuestions}) lebih sedikit dari jumlah tim (${teams.length}). Tambah soal dulu, atau kurangi tim yang ikut.`
    )
  }

  const slices = splitQuestionsForTeams(totalQuestions, teams.length)

  for (let index = 0; index < teams.length; index += 1) {
    const { error } = await supabase
      .from('participants')
      .update({
        team_index: index,
        question_start: slices[index].start,
        question_count: slices[index].count,
      })
      .eq('id', teams[index].id)

    if (error) {
      throw new Error(
        `${error.message}. Pastikan supabase/charades.sql sudah dijalankan di Supabase.`
      )
    }
  }

  await updateGame(gameId, {
    mode: 'charades',
    phase: 'quiz',
    current_round: 1,
    round_time_limit: roundTimeLimit,
    round_started_at: new Date().toISOString(),
    is_answer_revealed: false,
  })
}

/** Mulai babak berikutnya. Tim melanjutkan kata berikutnya di potongannya. */
export function startCharadesRound(gameId: string, round: number) {
  return updateGame(gameId, {
    phase: 'quiz',
    current_round: round,
    round_started_at: new Date().toISOString(),
    is_answer_revealed: false,
  })
}

/**
 * Pemegang HP menandai satu kata: BENAR (+1) atau LEWATI (0).
 *
 * Berbeda dari mode klasik, di sini pemain yang menulis skor karena dialah
 * jurinya — pemeraga/pemegang HP sudah tahu jawabannya sendiri. Skor tetap
 * terlihat langsung oleh host di layar kontrol.
 */
export async function markCharadeWord({
  participantId,
  questionId,
  correct,
  timeTakenMs,
}: {
  participantId: string
  questionId: string
  correct: boolean
  timeTakenMs: number
}) {
  const { error } = await supabase.from('answers').insert({
    participant_id: participantId,
    question_id: questionId,
    choice_id: null,
    free_text: null,
    score: correct ? CHARADE_POINT : 0,
    time_taken_ms: Math.max(0, Math.round(timeTakenMs)),
  })

  // 23505 = kata ini sudah dinilai (tap ganda / sinyal lambat) -> abaikan saja.
  if (error && error.code !== '23505') throw new Error(error.message)
}
