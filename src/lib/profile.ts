import { supabase, Profile, ProfileStatus } from '@/types/types'

/**
 * Akses data profil host.
 *
 * Pemain memakai sesi anonim dan TIDAK punya baris profil — itu normal dan
 * bukan error. Hanya host dengan akun (email atau Google) yang punya profil,
 * dan hanya yang berstatus `approved` yang boleh membuat/mengubah kuis.
 */

export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    // Tabel belum dipasang (skrip SQL belum dijalankan) — anggap tanpa profil
    // supaya aplikasi tetap jalan, bukan blank.
    if (error.code === '42P01' || error.code === 'PGRST205') return null
    throw new Error(error.message)
  }

  return data
}

/** Semua profil (hanya bisa dibaca admin, dijaga oleh RLS). */
export async function listProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Daftar pendaftar yang menunggu persetujuan. */
export async function listPendingProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select()
    .eq('status', 'pending')
    .order('created_at')

  if (error) throw new Error(error.message)
  return data ?? []
}

/** Admin menyetujui atau menolak pendaftar. */
export async function reviewProfile({
  userId,
  status,
  reviewerId,
}: {
  userId: string
  status: ProfileStatus
  reviewerId: string
}) {
  const { error } = await supabase
    .from('profiles')
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
    })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}

/** Admin mengangkat atau mencabut status admin seseorang. */
export async function setAdmin(userId: string, isAdmin: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)

  if (error) throw new Error(error.message)
}
