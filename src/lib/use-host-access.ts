'use client'

import { useCallback, useEffect, useState } from 'react'
import { Profile } from '@/types/types'
import { getMyProfile } from './profile'
import { useSession } from './use-session'

export type HostAccess = {
  /** Sesi Supabase sudah siap dibaca */
  ready: boolean
  userId: string | null
  email: string | null
  /** Pemain & host tamu memakai sesi anonim tanpa akun */
  isAnonymous: boolean
  profile: Profile | null
  profileLoading: boolean
  error: string | null
  /**
   * Boleh membuat / mengubah / menghapus kuis.
   * Wajib akun email/Google yang sudah disetujui admin.
   */
  canManageQuizzes: boolean
  /** Boleh membuka ruangan dari kuis yang sudah ada (tamu pun boleh). */
  canHost: boolean
  isAdmin: boolean
  statusLabel: string
  refresh: () => void
}

/**
 * Menentukan hak akses host berdasarkan sesi + status persetujuan akun.
 *
 * Aturan (ditegakkan juga oleh RLS di database):
 * - Tamu (anonim)        : boleh membuka ruangan, TIDAK boleh mengelola kuis
 * - Menunggu persetujuan : sama seperti tamu, sampai admin menyetujui
 * - Disetujui            : boleh mengelola kuis
 * - Admin                : ditambah akses halaman persetujuan
 */
export function useHostAccess(): HostAccess {
  const { ready, userId, isAnonymous, email, error: sessionError, refresh } = useSession()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadProfile = useCallback(async () => {
    if (!userId || isAnonymous) {
      setProfile(null)
      setProfileLoading(false)
      return
    }

    setProfileLoading(true)
    try {
      const data = await getMyProfile(userId)
      setProfile(data)
      setError(null)
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Gagal memuat status akun.'
      )
    } finally {
      setProfileLoading(false)
    }
  }, [userId, isAnonymous])

  useEffect(() => {
    if (!ready) return
    void loadProfile()
  }, [ready, loadProfile])

  const refreshAll = useCallback(() => {
    refresh()
    void loadProfile()
  }, [refresh, loadProfile])

  const isApproved = profile?.status === 'approved'
  const isAdmin = Boolean(profile?.is_admin)

  return {
    ready: ready && !profileLoading,
    userId,
    email,
    isAnonymous,
    profile,
    profileLoading,
    error: error ?? sessionError,
    canManageQuizzes: isApproved,
    canHost: true,
    isAdmin,
    statusLabel: statusLabelFor({ isAnonymous, profile }),
    refresh: refreshAll,
  }
}

function statusLabelFor({
  isAnonymous,
  profile,
}: {
  isAnonymous: boolean
  profile: Profile | null
}) {
  if (isAnonymous || !profile) return 'Tamu'
  if (profile.is_admin) return 'Admin'
  if (profile.status === 'approved') return 'Disetujui'
  if (profile.status === 'rejected') return 'Ditolak'
  return 'Menunggu persetujuan'
}
