'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  createQuizSet,
  deleteQuizSet,
  duplicateQuizSet,
  listQuizSets,
} from '@/lib/quiz'
import { createGame } from '@/lib/game'
import { useHostAccess } from '@/lib/use-host-access'
import { QuizSet } from '@/types/types'
import { coverGradient } from '@/constants'
import { cn } from '@/lib/utils'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Modal,
  Spinner,
} from '@/components/ui'

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Spinner className="h-8 w-8 text-violet-600" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}

function DashboardContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    ready,
    userId,
    isAnonymous,
    statusLabel,
    profile,
    canManageQuizzes,
    isAdmin,
  } = useHostAccess()

  const [quizzes, setQuizzes] = useState<QuizSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [tab, setTab] = useState<'mine' | 'all'>('mine')
  const [toDelete, setToDelete] = useState<QuizSet | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await listQuizSets()
      setQuizzes(data)
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Gagal memuat daftar kuis. Pastikan skrip supabase/setup.sql sudah dijalankan.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    load()
  }, [ready, load])

  const handleCreate = useCallback(async () => {
    if (!userId || creating) return
    if (!canManageQuizzes) {
      setError(
        'Akun Anda belum disetujui admin, jadi belum bisa membuat kuis baru.'
      )
      return
    }
    setCreating(true)
    try {
      const created = await createQuizSet('Kuis Baru')
      router.push(`/host/quiz/${created.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal membuat kuis')
      setCreating(false)
    }
  }, [userId, creating, router, canManageQuizzes])

  // Dukungan tautan "+ Buat kuis baru" dari navigasi: /host/dashboard?new=1
  useEffect(() => {
    if (!ready || !userId || !canManageQuizzes) return
    if (searchParams.get('new') === '1') {
      router.replace('/host/dashboard')
      void handleCreate()
    }
  }, [ready, userId, searchParams, router, handleCreate, canManageQuizzes])

  const myQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.user_id && quiz.user_id === userId),
    [quizzes, userId]
  )
  const publicQuizzes = useMemo(
    () => quizzes.filter((quiz) => quiz.is_public || quiz.user_id === userId),
    [quizzes, userId]
  )
  const visible = tab === 'mine' ? myQuizzes : publicQuizzes

  const handleHost = async (quiz: QuizSet) => {
    setBusyId(quiz.id)
    setError(null)
    try {
      const game = await createGame(quiz.id)
      router.push(`/host/game/${game.pin}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal membuka ruangan')
      setBusyId(null)
    }
  }

  const handleDuplicate = async (quiz: QuizSet) => {
    setBusyId(quiz.id)
    try {
      const copy = await duplicateQuizSet(quiz.id)
      await load()
      router.push(`/host/quiz/${copy.id}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal menduplikasi')
    } finally {
      setBusyId(null)
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const target = toDelete
    setToDelete(null)
    setBusyId(target.id)
    try {
      await deleteQuizSet(target.id)
      setQuizzes((current) => current.filter((quiz) => quiz.id !== target.id))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal menghapus')
    } finally {
      setBusyId(null)
    }
  }

  const totalQuestions = visible.reduce(
    (sum, quiz) => sum + quiz.questions.length,
    0
  )

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Kuis Saya
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {loading
              ? 'Memuat…'
              : `${visible.length} kuis · ${totalQuestions} soal total`}
          </p>
        </div>
        {canManageQuizzes ? (
          <Button
            onClick={handleCreate}
            loading={creating}
            size="lg"
            className="sm:w-auto"
            block
          >
            + Buat kuis baru
          </Button>
        ) : (
          <Badge tone="amber" className="!px-3 !py-2 !text-sm">
            {statusLabel}
          </Badge>
        )}
      </div>

      {!canManageQuizzes && !isAdmin && !loading && (
        <Alert
          tone={profile?.status === 'rejected' ? 'error' : 'warning'}
          className="mt-5"
        >
          {profile?.status === 'rejected' ? (
            <>
              Pendaftaran Anda <strong>ditolak</strong> admin. Hubungi admin
              kalau menurut Anda ini keliru.
            </>
          ) : isAnonymous ? (
            <>
              Anda masuk sebagai <strong>tamu</strong>. Kuis yang sudah ada tetap
              bisa dibuka dan dimainkan, tetapi untuk{' '}
              <strong>membuat kuis baru</strong> Anda perlu masuk dengan akun yang
              disetujui admin — klik menu akun di sidebar.
            </>
          ) : (
            <>
              Akun Anda <strong>menunggu persetujuan admin</strong>. Sementara ini
              kuis yang sudah ada tetap bisa dibuka dan dimainkan, tetapi Anda
              belum bisa membuat kuis baru.
            </>
          )}
        </Alert>
      )}

      {canManageQuizzes && isAdmin && (
        <Alert tone="success" className="mt-5">
          Anda masuk sebagai <strong>admin</strong>. Ada pendaftar baru?{' '}
          <a
            href="/host/admin"
            className="font-semibold underline underline-offset-2"
          >
            Buka halaman Admin
          </a>
          .
        </Alert>
      )}

      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      {/* Tab */}
      <div className="mt-6 flex gap-2 border-b border-slate-200">
        {(
          [
            { id: 'mine', label: `Milik saya (${myQuizzes.length})` },
            { id: 'all', label: `Semua kuis publik (${publicQuizzes.length})` },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              '-mb-px border-b-2 px-3 py-2.5 text-sm font-semibold transition',
              tab === item.id
                ? 'border-violet-600 text-violet-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Daftar */}
      <div className="mt-6">
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((key) => (
              <div
                key={key}
                className="h-40 animate-pulse rounded-2xl bg-slate-200/70"
              />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            }
            title={
              tab === 'mine'
                ? 'Belum ada kuis di sini'
                : 'Belum ada kuis publik'
            }
            description={
              canManageQuizzes
                ? 'Mulai dari kuis kosong, isi soal dan jawaban benarnya, lalu bagikan PIN ke pemain.'
                : 'Belum ada kuis publik yang bisa dimainkan. Minta admin menyetujui akun Anda agar bisa membuat kuis sendiri.'
            }
            action={
              canManageQuizzes ? (
                <Button onClick={handleCreate} loading={creating} size="lg">
                  + Buat kuis pertama
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visible.map((quiz) => (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                mine={quiz.user_id === userId}
                canManage={canManageQuizzes}
                busy={busyId === quiz.id}
                onHost={() => handleHost(quiz)}
                onDuplicate={() => handleDuplicate(quiz)}
                onDelete={() => setToDelete(quiz)}
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Hapus kuis ini?"
        description={`"${toDelete?.name}" beserta semua soal di dalamnya akan dihapus permanen. Riwayat permainan yang pernah memakai kuis ini juga ikut terhapus.`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setToDelete(null)}>
              Batal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Ya, hapus
            </Button>
          </>
        }
      />
    </div>
  )
}

function QuizCard({
  quiz,
  mine,
  canManage,
  busy,
  onHost,
  onDuplicate,
  onDelete,
}: {
  quiz: QuizSet
  mine: boolean
  canManage: boolean
  busy: boolean
  onHost: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const gradient = coverGradient(quiz.cover_color)
  const questions = quiz.questions.length

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div
        className="relative h-24 px-5 pt-4"
        style={{
          backgroundImage: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 font-display text-lg font-extrabold leading-tight text-white drop-shadow-sm">
            {quiz.name}
          </p>
          {!mine && (
            <span className="shrink-0 rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur">
              {quiz.user_id ? 'Pemilik lain' : 'Tanpa pemilik'}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={questions > 0 ? 'violet' : 'amber'}>
            {questions} soal
          </Badge>
          {quiz.is_public ? (
            <Badge tone="emerald">Publik</Badge>
          ) : (
            <Badge tone="slate">Privat</Badge>
          )}
          {quiz.description && (
            <span className="truncate text-xs text-slate-400">
              {quiz.description}
            </span>
          )}
        </div>

        <div className="mt-auto pt-4">
          {questions === 0 && (
            <p className="mb-3 text-xs font-medium text-amber-600">
              Tambahkan minimal satu soal sebelum dimainkan.
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={onHost}
              loading={busy}
              disabled={questions === 0}
            >
              ▶ Mainkan
            </Button>
            {mine && canManage && (
              <>
                <ButtonLink
                  href={`/host/quiz/${quiz.id}`}
                  size="sm"
                  variant="secondary"
                >
                  Edit
                </ButtonLink>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDuplicate}
                  disabled={busy}
                >
                  Duplikat
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onDelete}
                  disabled={busy}
                  className="text-rose-600 hover:bg-rose-50"
                >
                  Hapus
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
