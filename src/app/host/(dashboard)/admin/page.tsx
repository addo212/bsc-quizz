'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Profile, ProfileStatus } from '@/types/types'
import { listProfiles, reviewProfile, setAdmin } from '@/lib/profile'
import { useHostAccess } from '@/lib/use-host-access'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/player-chip'
import {
  Alert,
  Badge,
  Button,
  ButtonLink,
  EmptyState,
  Spinner,
} from '@/components/ui'

const STATUS_META: Record<
  ProfileStatus,
  { label: string; tone: 'amber' | 'emerald' | 'rose' }
> = {
  pending: { label: 'Menunggu', tone: 'amber' },
  approved: { label: 'Disetujui', tone: 'emerald' },
  rejected: { label: 'Ditolak', tone: 'rose' },
}

export default function AdminPage() {
  const { ready, isAdmin, isAnonymous, profile, userId } = useHostAccess()

  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setProfiles(await listProfiles())
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Gagal memuat daftar pendaftar.'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!isAdmin) {
      setLoading(false)
      return
    }
    void load()
  }, [ready, isAdmin, load])

  const review = async (target: Profile, status: ProfileStatus) => {
    if (!userId) return
    setBusyId(target.id)
    setError(null)
    try {
      await reviewProfile({ userId: target.id, status, reviewerId: userId })
      setProfiles((current) =>
        current.map((row) =>
          row.id === target.id
            ? {
                ...row,
                status,
                reviewed_at: new Date().toISOString(),
                reviewed_by: userId,
              }
            : row
        )
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal menyimpan')
    } finally {
      setBusyId(null)
    }
  }

  const toggleAdmin = async (target: Profile) => {
    setBusyId(target.id)
    setError(null)
    try {
      const next = !target.is_admin
      await setAdmin(target.id, next)
      setProfiles((current) =>
        current.map((row) =>
          row.id === target.id ? { ...row, is_admin: next } : row
        )
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal mengubah admin')
    } finally {
      setBusyId(null)
    }
  }

  const pending = useMemo(
    () => profiles.filter((row) => row.status === 'pending'),
    [profiles]
  )
  const others = useMemo(
    () => profiles.filter((row) => row.status !== 'pending'),
    [profiles]
  )

  if (!ready) {
    return (
      <div className="flex justify-center py-20">
        <Spinner className="h-8 w-8 text-violet-600" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-16">
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          }
          title="Halaman ini khusus admin"
          description={
            isAnonymous
              ? 'Anda belum masuk dengan akun. Masuk lewat menu akun di sidebar.'
              : `Akun ${profile?.email ?? ''} bukan admin, jadi tidak bisa melihat daftar pendaftar.`
          }
          action={
            <ButtonLink href="/host/dashboard" size="lg">
              Kembali ke Kuis Saya
            </ButtonLink>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Persetujuan Akun
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            {loading
              ? 'Memuat…'
              : `${pending.length} menunggu · ${others.length} sudah diproses`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          ↻ Muat ulang
        </Button>
      </div>

      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}

      {pending.length > 0 && (
        <Alert tone="warning" className="mt-5">
          Ada <strong>{pending.length} pendaftar</strong> yang belum bisa membuat
          kuis sampai Anda menyetujuinya.
        </Alert>
      )}

      {/* Menunggu persetujuan */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
          Menunggu persetujuan
        </h2>

        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((key) => (
              <div
                key={key}
                className="h-20 animate-pulse rounded-2xl bg-slate-200/70"
              />
            ))}
          </div>
        ) : pending.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 px-5 py-8 text-center text-sm text-slate-500">
            Tidak ada pendaftar yang menunggu. 🎉
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((row) => (
              <ProfileRow
                key={row.id}
                profile={row}
                busy={busyId === row.id}
                onApprove={() => review(row, 'approved')}
                onReject={() => review(row, 'rejected')}
              />
            ))}
          </div>
        )}
      </section>

      {/* Sudah diproses */}
      {others.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Sudah diproses
          </h2>
          <div className="space-y-3">
            {others.map((row) => (
              <ProfileRow
                key={row.id}
                profile={row}
                busy={busyId === row.id}
                onApprove={() => review(row, 'approved')}
                onReject={() => review(row, 'rejected')}
                onToggleAdmin={() => toggleAdmin(row)}
                isSelf={row.id === userId}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function ProfileRow({
  profile,
  busy,
  isSelf = false,
  onApprove,
  onReject,
  onToggleAdmin,
}: {
  profile: Profile
  busy: boolean
  isSelf?: boolean
  onApprove: () => void
  onReject: () => void
  onToggleAdmin?: () => void
}) {
  const meta = STATUS_META[profile.status]
  const name = profile.full_name || profile.email || 'Tanpa nama'

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.avatar_url}
            alt=""
            className="h-10 w-10 shrink-0 rounded-2xl object-cover"
          />
        ) : (
          <Avatar name={name} size="md" />
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {name}
            {isSelf && (
              <span className="ml-2 text-xs font-normal text-slate-400">
                (Anda)
              </span>
            )}
          </p>
          <p className="truncate text-xs text-slate-500">{profile.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {profile.is_admin && <Badge tone="violet">Admin</Badge>}
            <span className="text-[11px] uppercase tracking-wide text-slate-400">
              via {profile.provider ?? 'email'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 sm:justify-end">
        {profile.status !== 'approved' && (
          <Button size="sm" variant="success" onClick={onApprove} loading={busy}>
            ✓ Setujui
          </Button>
        )}
        {profile.status !== 'rejected' && !isSelf && (
          <Button size="sm" variant="secondary" onClick={onReject} disabled={busy}>
            Tolak
          </Button>
        )}
        {onToggleAdmin && !isSelf && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleAdmin}
            disabled={busy}
            className={cn(profile.is_admin && 'text-violet-700')}
          >
            {profile.is_admin ? 'Cabut admin' : 'Jadikan admin'}
          </Button>
        )}
      </div>
    </div>
  )
}
