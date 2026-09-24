import { supabase, Choice, Question, QuizSet } from '@/types/types'
import { DEFAULT_POINTS, DEFAULT_TIME_LIMIT } from '@/constants'

/**
 * Mengambil semua quiz beserta soal & pilihannya.
 * Dipakai host untuk memuat quiz yang akan dimainkan.
 */
export async function listQuizSets(): Promise<QuizSet[]> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .select('*, questions(*, choices(*))')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map(normalizeQuizSet)
}

export async function getQuizSet(quizId: string): Promise<QuizSet | null> {
  const { data, error } = await supabase
    .from('quiz_sets')
    .select('*, questions(*, choices(*))')
    .eq('id', quizId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null

  return normalizeQuizSet(data)
}

/** Quiz beserta jumlah soal (tanpa menarik semua detail). */
export async function listQuizSummaries(): Promise<QuizSet[]> {
  return listQuizSets()
}

export async function createQuizSet(name = 'Quiz Tanpa Judul') {
  const { data, error } = await supabase
    .from('quiz_sets')
    .insert({ name, description: '', cover_color: 'violet' })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateQuizSet(
  quizId: string,
  patch: {
    name?: string
    description?: string | null
    cover_color?: string
    is_public?: boolean
  }
) {
  const { error } = await supabase
    .from('quiz_sets')
    .update(patch)
    .eq('id', quizId)
  if (error) throw new Error(error.message)
}

export async function deleteQuizSet(quizId: string) {
  const { error } = await supabase.from('quiz_sets').delete().eq('id', quizId)
  if (error) throw new Error(error.message)
}

export async function duplicateQuizSet(quizId: string): Promise<QuizSet> {
  const original = await getQuizSet(quizId)
  if (!original) throw new Error('Quiz tidak ditemukan')

  const copy = await createQuizSet(`${original.name} (salinan)`)
  await updateQuizSet(copy.id, {
    description: original.description,
    cover_color: original.cover_color,
    is_public: original.is_public,
  })

  await saveQuiz({
    quizId: copy.id,
    questions: original.questions.map((question) => ({
      ...question,
      id: crypto.randomUUID(),
      choices: question.choices.map((choice) => ({
        ...choice,
        id: crypto.randomUUID(),
      })),
    })),
  })

  const result = await getQuizSet(copy.id)
  if (!result) throw new Error('Gagal menyalin quiz')
  return result
}

/**
 * Simpan seluruh daftar soal dengan strategi "upsert + hapus sisa".
 *
 * ID soal/pilihan dibuat di sisi klien (crypto.randomUUID) sehingga kita bisa
 * membedakan baris baru dan baris lama tanpa menghapus data permainan lampau.
 */
export async function saveQuiz({
  quizId,
  questions,
}: {
  quizId: string
  questions: Question[]
}) {
  const payloadQuestions = questions.map((question, index) => ({
    id: question.id || crypto.randomUUID(),
    quiz_set_id: quizId,
    body: question.body?.trim() || `Soal ${index + 1}`,
    image_url: question.image_url?.trim() ? question.image_url.trim() : null,
    order: index,
    time_limit: question.time_limit ?? DEFAULT_TIME_LIMIT,
    points: question.points ?? DEFAULT_POINTS,
  }))

  const payloadChoices = questions.flatMap((question, qIndex) =>
    (question.choices ?? []).map((choice) => ({
      id: choice.id || crypto.randomUUID(),
      question_id: payloadQuestions[qIndex].id,
      body: choice.body?.trim() ? choice.body.trim() : 'Pilihan',
      is_correct: Boolean(choice.is_correct),
    }))
  )

  if (payloadQuestions.length > 0) {
    const { error } = await supabase
      .from('questions')
      .upsert(payloadQuestions, { onConflict: 'id' })
    if (error) throw new Error(`Gagal menyimpan soal: ${error.message}`)
  }

  if (payloadChoices.length > 0) {
    const { error } = await supabase
      .from('choices')
      .upsert(payloadChoices, { onConflict: 'id' })
    if (error) throw new Error(`Gagal menyimpan pilihan: ${error.message}`)
  }

  // Hapus soal yang sudah dibuang di editor.
  const questionIds = payloadQuestions.map((q) => q.id)
  const { data: existing } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_set_id', quizId)

  const toDelete = (existing ?? [])
    .map((row) => row.id)
    .filter((id) => !questionIds.includes(id))

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('questions')
      .delete()
      .in('id', toDelete)
    if (error) throw new Error(`Gagal menghapus soal: ${error.message}`)
  }

  // Hapus pilihan yang sudah dibuang (soal yang dihapus otomatis ter-cascade).
  const choiceIds = payloadChoices.map((c) => c.id)
  const questionIdsForChoices = payloadQuestions.map((q) => q.id)
  if (questionIdsForChoices.length > 0) {
    const { data: existingChoices } = await supabase
      .from('choices')
      .select('id')
      .in('question_id', questionIdsForChoices)

    const choicesToDelete = (existingChoices ?? [])
      .map((row) => row.id)
      .filter((id) => !choiceIds.includes(id))

    if (choicesToDelete.length > 0) {
      const { error } = await supabase
        .from('choices')
        .delete()
        .in('id', choicesToDelete)
      if (error) throw new Error(`Gagal menghapus pilihan: ${error.message}`)
    }
  }
}

function normalizeQuizSet(row: any): QuizSet {
  const questions: Question[] = (row.questions ?? [])
    .slice()
    .sort((a: Question, b: Question) => a.order - b.order)
    .map((question: Question) => ({
      ...question,
      time_limit: question.time_limit ?? DEFAULT_TIME_LIMIT,
      points: question.points ?? DEFAULT_POINTS,
      choices: (question.choices ?? [])
        .slice()
        .sort((a: Choice, b: Choice) =>
          a.created_at < b.created_at ? -1 : a.created_at > b.created_at ? 1 : 0
        ),
    }))

  return { ...(row as QuizSet), questions }
}
