'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Choice, Question, QuizSet } from '@/types/types'
import { getQuizSet, saveQuiz, updateQuizSet } from '@/lib/quiz'
import { createGame } from '@/lib/game'
import { useSession } from '@/lib/use-session'
import {
  COVER_COLORS,
  DEFAULT_POINTS,
  DEFAULT_TIME_LIMIT,
  MAX_NAME_LENGTH,
  MAX_TIME_LIMIT,
  MIN_TIME_LIMIT,
} from '@/constants'
import { cn, downloadJson, slugify } from '@/lib/utils'
import { AnswerShape } from '@/components/game-ui'
import {
  Alert,
  Button,
  ButtonLink,
  Field,
  Input,
  Spinner,
  Textarea,
} from '@/components/ui'

const TIME_OPTIONS = [5, 10, 15, 20, 30, 45, 60, 90, 120]
const POINT_OPTIONS = [0, 100, 500, 1000, 1500, 2000]

type Draft = {
  name: string
  description: string
  cover_color: string
  is_public: boolean
  questions: Question[]
}

function emptyChoice(): Choice {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    question_id: '',
    body: '',
    is_correct: false,
  }
}

function emptyQuestion(order: number): Question {
  return {
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    body: '',
    image_url: null,
    order,
    quiz_set_id: '',
    time_limit: DEFAULT_TIME_LIMIT,
    points: DEFAULT_POINTS,
    choices: [emptyChoice(), emptyChoice()],
  }
}

export default function QuizEditorPage({
  params,
}: {
  params: { quizId: string }
}) {
  const quizId = params.quizId
  const router = useRouter()
  const { ready } = useSession()

  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [starting, setStarting] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [showSettings, setShowSettings] = useState(true)

  const draftRef = useRef<Draft | null>(null)
  draftRef.current = draft

  /* ------------------------------- Muat quiz ------------------------------- */
  useEffect(() => {
    if (!ready) return
    let alive = true
    ;(async () => {
      try {
        const quiz = await getQuizSet(quizId)
        if (!alive) return
        if (!quiz) {
          setError('Kuis tidak ditemukan.')
          setLoading(false)
          return
        }
        setDraft({
          name: quiz.name,
          description: quiz.description ?? '',
          cover_color: quiz.cover_color ?? 'violet',
          is_public: quiz.is_public,
          questions:
            quiz.questions.length > 0 ? quiz.questions : [emptyQuestion(0)],
        })
        setLoading(false)
      } catch (caught) {
        if (!alive) return
        setError(caught instanceof Error ? caught.message : 'Gagal memuat kuis')
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [ready, quizId])

  const mutate = useCallback((updater: (current: Draft) => Draft) => {
    setDraft((current) => (current ? updater(current) : current))
    setDirty(true)
  }, [])

  /* -------------------------------- Validasi ------------------------------- */
  const problems = useMemo(() => {
    if (!draft) return []
    const list: string[] = []
    if (!draft.name.trim()) list.push('Judul kuis masih kosong.')
    draft.questions.forEach((question, index) => {
      if (!question.body.trim()) list.push(`Soal ${index + 1} belum diisi.`)
      const filled = question.choices.filter((choice) => choice.body.trim())
      if (filled.length < 2)
        list.push(`Soal ${index + 1} butuh minimal 2 pilihan jawaban.`)
      if (!question.choices.some((choice) => choice.is_correct))
        list.push(`Soal ${index + 1} belum punya jawaban benar.`)
    })
    return list
  }, [draft])

  /* --------------------------------- Simpan -------------------------------- */
  const save = useCallback(
    async (options?: { silent?: boolean }) => {
      const current = draftRef.current
      if (!current) return false

      setSaving(true)
      setError(null)
      try {
        await updateQuizSet(quizId, {
          name: current.name.trim() || 'Kuis Tanpa Judul',
          description: current.description.trim(),
          cover_color: current.cover_color,
          is_public: current.is_public,
        })
        await saveQuiz({ quizId, questions: current.questions })
        setDirty(false)
        setSavedAt(Date.now())
        return true
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Gagal menyimpan')
        if (!options?.silent) setSaving(false)
        return false
      } finally {
        setSaving(false)
      }
    },
    [quizId]
  )

  const handleSave = () => void save()

  const handlePlay = async () => {
    if (!draft || problems.length > 0) return
    setStarting(true)
    const ok = await save({ silent: true })
    if (!ok) {
      setStarting(false)
      return
    }
    try {
      const game = await createGame(quizId)
      router.push(`/host/game/${game.pin}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal membuka ruangan')
      setStarting(false)
    }
  }

  /* ------------------------------- Manipulasi ------------------------------ */
  const addQuestion = () => {
    const nextIndex = draftRef.current?.questions.length ?? 0
    mutate((current) => ({
      ...current,
      questions: [...current.questions, emptyQuestion(current.questions.length)],
    }))
    setActiveIndex(nextIndex)
  }

  const duplicateQuestion = (index: number) => {
    mutate((current) => {
      const source = current.questions[index]
      const copy: Question = {
        ...source,
        id: crypto.randomUUID(),
        body: source.body,
        choices: source.choices.map((choice) => ({
          ...choice,
          id: crypto.randomUUID(),
          question_id: '',
        })),
      }
      const questions = [...current.questions]
      questions.splice(index + 1, 0, copy)
      return { ...current, questions }
    })
  }

  const removeQuestion = (index: number) => {
    const remaining = Math.max(0, (draftRef.current?.questions.length ?? 1) - 1)
    mutate((current) => ({
      ...current,
      questions: current.questions.filter((_, i) => i !== index),
    }))
    setActiveIndex((value) => Math.max(0, Math.min(value, Math.max(0, remaining - 1))))
  }

  const moveQuestion = (index: number, direction: -1 | 1) => {
    mutate((current) => {
      const next = index + direction
      if (next < 0 || next >= current.questions.length) return current
      const questions = [...current.questions]
      const [item] = questions.splice(index, 1)
      questions.splice(next, 0, item)
      return { ...current, questions }
    })
    setActiveIndex((value) => value + direction)
  }

  const updateQuestion = (index: number, patch: Partial<Question>) => {
    mutate((current) => ({
      ...current,
      questions: current.questions.map((question, i) =>
        i === index ? { ...question, ...patch } : question
      ),
    }))
  }

  const updateChoice = (
    questionIndex: number,
    choiceIndex: number,
    patch: Partial<Choice>
  ) => {
    mutate((current) => ({
      ...current,
      questions: current.questions.map((question, i) => {
        if (i !== questionIndex) return question
        return {
          ...question,
          choices: question.choices.map((choice, ci) =>
            ci === choiceIndex ? { ...choice, ...patch } : choice
          ),
        }
      }),
    }))
  }

  const setCorrectChoice = (questionIndex: number, choiceIndex: number) => {
    mutate((current) => ({
      ...current,
      questions: current.questions.map((question, i) => {
        if (i !== questionIndex) return question
        return {
          ...question,
          choices: question.choices.map((choice, ci) => ({
            ...choice,
            is_correct: ci === choiceIndex,
          })),
        }
      }),
    }))
  }

  const addChoice = (questionIndex: number) => {
    mutate((current) => ({
      ...current,
      questions: current.questions.map((question, i) =>
        i === questionIndex && question.choices.length < 4
          ? { ...question, choices: [...question.choices, emptyChoice()] }
          : question
      ),
    }))
  }

  const removeChoice = (questionIndex: number, choiceIndex: number) => {
    mutate((current) => ({
      ...current,
      questions: current.questions.map((question, i) => {
        if (i !== questionIndex || question.choices.length <= 2) return question
        const choices = question.choices.filter((_, ci) => ci !== choiceIndex)
        // Pastikan selalu ada satu jawaban benar setelah penghapusan.
        if (!choices.some((choice) => choice.is_correct) && choices[0]) {
          choices[0] = { ...choices[0], is_correct: true }
        }
        return { ...question, choices }
      }),
    }))
  }

  const handleExport = () => {
    const current = draftRef.current
    if (!current) return
    downloadJson(`quiz-${slugify(current.name)}.json`, {
      name: current.name,
      description: current.description,
      questions: current.questions.map((question) => ({
        body: question.body,
        image_url: question.image_url,
        time_limit: question.time_limit,
        points: question.points,
        choices: question.choices.map((choice) => ({
          body: choice.body,
          is_correct: choice.is_correct,
        })),
      })),
    })
  }

  const handleImport = async (file: File) => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const incoming: any[] = Array.isArray(parsed) ? parsed : parsed.questions
      if (!Array.isArray(incoming) || incoming.length === 0) {
        throw new Error('File tidak berisi daftar soal.')
      }

      const questions: Question[] = incoming.map((raw, index) => ({
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        body: String(raw.body ?? raw.question ?? `Soal ${index + 1}`),
        image_url: raw.image_url ?? null,
        order: index,
        quiz_set_id: '',
        time_limit: Number(raw.time_limit) || DEFAULT_TIME_LIMIT,
        points: Number(raw.points) || DEFAULT_POINTS,
        choices: (Array.isArray(raw.choices) ? raw.choices : []).map(
          (choice: any): Choice => ({
            id: crypto.randomUUID(),
            created_at: new Date().toISOString(),
            question_id: '',
            body: String(choice.body ?? choice.text ?? ''),
            is_correct: Boolean(choice.is_correct),
          })
        ),
      }))

      mutate((current) => ({
        ...current,
        name: current.name || parsed.name || 'Kuis Impor',
        questions,
      }))
      setActiveIndex(0)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? `Gagal mengimpor: ${caught.message}`
          : 'Gagal mengimpor file'
      )
    }
  }

  /* --------------------------------- Render -------------------------------- */
  if (loading || !ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-violet-600" />
      </div>
    )
  }

  if (!draft) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Alert tone="error">{error ?? 'Kuis tidak ditemukan.'}</Alert>
        <ButtonLink href="/host/dashboard" className="mt-5" size="lg">
          Kembali ke dashboard
        </ButtonLink>
      </div>
    )
  }

  const gradient =
    COVER_COLORS.find((color) => color.id === draft.cover_color) ??
    COVER_COLORS[0]

  return (
    <div className="pb-28">
      {/* Breadcrumb + aksi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/host/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          ← Kembali
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-medium text-slate-400 sm:inline">
            {saving
              ? 'Menyimpan…'
              : dirty
                ? 'Ada perubahan belum disimpan'
                : savedAt
                  ? 'Tersimpan'
                  : ''}
          </span>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            Unduh JSON
          </Button>
          <label className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50">
            Impor JSON
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void handleImport(file)
                event.target.value = ''
              }}
            />
          </label>
        </div>
      </div>

      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}

      {/* Cover + judul */}
      <div
        className="mt-4 overflow-hidden rounded-3xl shadow-sm"
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        }}
      >
        <div className="bg-black/10 px-5 py-6 backdrop-blur-sm sm:px-7 sm:py-8">
          <input
            value={draft.name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(event) =>
              mutate((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="Judul kuis"
            className="w-full border-none bg-transparent font-display text-2xl font-extrabold text-white placeholder:text-white/50 focus:outline-none sm:text-3xl"
          />
          <input
            value={draft.description}
            onChange={(event) =>
              mutate((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Deskripsi singkat (opsional)"
            className="mt-2 w-full border-none bg-transparent text-sm text-white/85 placeholder:text-white/50 focus:outline-none"
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur">
              {draft.questions.length} soal
            </span>
            <button
              type="button"
              onClick={() => setShowSettings((value) => !value)}
              className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur transition hover:bg-white/30"
            >
              {showSettings ? 'Sembunyikan pengaturan' : 'Pengaturan tampilan'}
            </button>
          </div>
        </div>
      </div>

      {/* Pengaturan */}
      {showSettings && (
        <div className="mt-4 animate-fade-in rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Warna cover
              </p>
              <div className="flex flex-wrap gap-2">
                {COVER_COLORS.map((color) => (
                  <button
                    key={color.id}
                    type="button"
                    title={color.label}
                    onClick={() =>
                      mutate((current) => ({
                        ...current,
                        cover_color: color.id,
                      }))
                    }
                    className={cn(
                      'h-9 w-9 rounded-xl ring-offset-2 transition',
                      draft.cover_color === color.id
                        ? 'ring-2 ring-slate-900'
                        : 'hover:scale-105'
                    )}
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                    }}
                  />
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <input
                type="checkbox"
                checked={draft.is_public}
                onChange={(event) =>
                  mutate((current) => ({
                    ...current,
                    is_public: event.target.checked,
                  }))
                }
                className="h-4 w-4 accent-violet-600"
              />
              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Tampilkan sebagai kuis publik
                </span>
                <span className="block text-xs text-slate-500">
                  Bisa dilihat host lain di tab &quot;Semua kuis publik&quot;
                </span>
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Navigasi soal */}
      <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 thin-scrollbar">
        {draft.questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => setActiveIndex(index)}
            className={cn(
              'h-9 w-9 shrink-0 rounded-lg text-sm font-bold transition',
              activeIndex === index
                ? 'bg-slate-900 text-white'
                : question.body.trim()
                  ? 'bg-white text-slate-700 shadow-sm hover:bg-slate-50'
                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
            )}
          >
            {index + 1}
          </button>
        ))}
        <button
          onClick={addQuestion}
          className="h-9 shrink-0 rounded-lg border border-dashed border-slate-300 px-3 text-sm font-semibold text-slate-500 transition hover:border-violet-400 hover:text-violet-600"
        >
          + Soal
        </button>
      </div>

      {/* Editor soal aktif */}
      {draft.questions[activeIndex] ? (
        <QuestionEditor
          question={draft.questions[activeIndex]}
          index={activeIndex}
          total={draft.questions.length}
          onUpdate={(patch) => updateQuestion(activeIndex, patch)}
          onUpdateChoice={(choiceIndex, patch) =>
            updateChoice(activeIndex, choiceIndex, patch)
          }
          onSetCorrect={(choiceIndex) =>
            setCorrectChoice(activeIndex, choiceIndex)
          }
          onAddChoice={() => addChoice(activeIndex)}
          onRemoveChoice={(choiceIndex) =>
            removeChoice(activeIndex, choiceIndex)
          }
          onDuplicate={() => duplicateQuestion(activeIndex)}
          onRemove={() => removeQuestion(activeIndex)}
          onMove={(direction) => moveQuestion(activeIndex, direction)}
        />
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm text-slate-500">
            Belum ada soal. Tambahkan soal pertama Anda.
          </p>
          <Button className="mt-4" onClick={addQuestion}>
            + Tambah soal
          </Button>
        </div>
      )}

      {/* Bar aksi bawah */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur safe-bottom lg:sticky lg:left-auto lg:right-auto lg:mt-8 lg:rounded-2xl lg:border lg:px-5">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="hidden min-w-0 flex-1 sm:block">
            {problems.length > 0 ? (
              <p className="truncate text-xs font-medium text-amber-600">
                ⚠ {problems[0]}
                {problems.length > 1 ? ` (+${problems.length - 1} lagi)` : ''}
              </p>
            ) : (
              <p className="text-xs font-medium text-emerald-600">
                ✓ Kuis siap dimainkan
              </p>
            )}
          </div>
          <Button variant="secondary" onClick={handleSave} loading={saving}>
            Simpan
          </Button>
          <Button
            onClick={handlePlay}
            loading={starting}
            disabled={problems.length > 0}
          >
            ▶ Mainkan
          </Button>
        </div>
      </div>

      {problems.length > 0 && (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Perlu dilengkapi sebelum dimainkan
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-amber-700">
            {problems.slice(0, 6).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

function QuestionEditor({
  question,
  index,
  total,
  onUpdate,
  onUpdateChoice,
  onSetCorrect,
  onAddChoice,
  onRemoveChoice,
  onDuplicate,
  onRemove,
  onMove,
}: {
  question: Question
  index: number
  total: number
  onUpdate: (patch: Partial<Question>) => void
  onUpdateChoice: (choiceIndex: number, patch: Partial<Choice>) => void
  onSetCorrect: (choiceIndex: number) => void
  onAddChoice: () => void
  onRemoveChoice: (choiceIndex: number) => void
  onDuplicate: () => void
  onRemove: () => void
  onMove: (direction: -1 | 1) => void
}) {
  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-extrabold text-slate-900">
          Soal {index + 1}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            title="Naikkan"
          >
            ↑
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
            title="Turunkan"
          >
            ↓
          </button>
          <button
            onClick={onDuplicate}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            title="Duplikat soal"
          >
            ⧉
          </button>
          <button
            onClick={onRemove}
            className="rounded-lg p-2 text-rose-400 transition hover:bg-rose-50 hover:text-rose-600"
            title="Hapus soal"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <Field label="Pertanyaan">
          <Textarea
            rows={2}
            value={question.body}
            onChange={(event) => onUpdate({ body: event.target.value })}
            placeholder="Tulis pertanyaannya di sini…"
            className="font-medium"
          />
        </Field>

        <Field
          label="URL gambar (opsional)"
          hint="Tempel tautan gambar publik (https://…) untuk ditampilkan di atas soal."
        >
          <Input
            value={question.image_url ?? ''}
            onChange={(event) =>
              onUpdate({ image_url: event.target.value || null })
            }
            placeholder="https://contoh.com/gambar.jpg"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Waktu menjawab">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={MIN_TIME_LIMIT}
                max={MAX_TIME_LIMIT}
                value={question.time_limit}
                onChange={(event) =>
                  onUpdate({
                    time_limit: clampNumber(
                      Number(event.target.value),
                      MIN_TIME_LIMIT,
                      MAX_TIME_LIMIT,
                      DEFAULT_TIME_LIMIT
                    ),
                  })
                }
                className="w-24"
              />
              <div className="flex flex-wrap gap-1.5">
                {TIME_OPTIONS.slice(0, 4).map((seconds) => (
                  <button
                    key={seconds}
                    type="button"
                    onClick={() => onUpdate({ time_limit: seconds })}
                    className={cn(
                      'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
                      question.time_limit === seconds
                        ? 'bg-violet-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {seconds}s
                  </button>
                ))}
              </div>
            </div>
          </Field>

          <Field
            label="Poin maksimal"
            hint="Poin penuh kalau menjawab instan, separuh kalau mentok waktu. Isi 0 untuk tanpa poin."
          >
            <div className="flex flex-wrap gap-1.5">
              {POINT_OPTIONS.map((points) => (
                <button
                  key={points}
                  type="button"
                  onClick={() => onUpdate({ points })}
                  className={cn(
                    'rounded-lg px-2.5 py-2 text-xs font-semibold transition',
                    question.points === points
                      ? 'bg-violet-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {points === 0 ? 'Tanpa poin' : `${points}`}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Pilihan jawaban */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pilihan jawaban{' '}
            <span className="normal-case text-slate-400">
              (klik lingkaran untuk menandai jawaban benar)
            </span>
          </p>

          <div className="space-y-2.5">
            {question.choices.map((choice, choiceIndex) => (
              <div
                key={choice.id}
                className={cn(
                  'flex items-center gap-3 rounded-xl border p-2.5 transition',
                  choice.is_correct
                    ? 'border-emerald-300 bg-emerald-50/60'
                    : 'border-slate-200 bg-white'
                )}
              >
                <button
                  type="button"
                  onClick={() => onSetCorrect(choiceIndex)}
                  aria-label={`Tandai pilihan ${choiceIndex + 1} sebagai benar`}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition',
                    choice.is_correct
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 hover:bg-slate-300'
                  )}
                >
                  <AnswerShape
                    index={choiceIndex}
                    className={cn('h-4 w-4', !choice.is_correct && 'text-slate-500')}
                  />
                </button>

                <Input
                  value={choice.body}
                  onChange={(event) =>
                    onUpdateChoice(choiceIndex, { body: event.target.value })
                  }
                  placeholder={`Pilihan ${choiceIndex + 1}`}
                  className="border-transparent bg-transparent shadow-none focus:border-violet-400 focus:bg-white"
                />

                {choice.is_correct && (
                  <span className="hidden shrink-0 pr-1 text-xs font-bold text-emerald-600 sm:inline">
                    Benar
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onRemoveChoice(choiceIndex)}
                  disabled={question.choices.length <= 2}
                  className="shrink-0 rounded-lg p-2 text-slate-300 transition hover:bg-rose-50 hover:text-rose-500 disabled:opacity-30"
                  title="Hapus pilihan"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {question.choices.length < 4 && (
            <button
              type="button"
              onClick={onAddChoice}
              className="mt-2.5 w-full rounded-xl border border-dashed border-slate-300 py-2.5 text-sm font-semibold text-slate-500 transition hover:border-violet-400 hover:text-violet-600"
            >
              + Tambah pilihan (maks 4)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function clampNumber(
  value: number,
  min: number,
  max: number,
  fallback: number
) {
  if (!Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.round(value)))
}
