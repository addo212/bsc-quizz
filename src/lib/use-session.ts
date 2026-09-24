'use client'

import { useCallback, useEffect, useState } from 'react'
import { isSupabaseConfigured, supabase } from '@/types/types'

export type SessionState = {
  /** true setelah proses cek/`signInAnonymously` selesai */
  ready: boolean
  userId: string | null
  isAnonymous: boolean
  email: string | null
  error: string | null
  refresh: () => void
}

/**
 * Deteksi user anonim.
 * Properti `is_anonymous` tidak selalu ada di tipe @supabase/supabase-js,
 * jadi kita cek dua cara sekaligus.
 */
export function isAnonymousUser(
  user?: {
    is_anonymous?: boolean
    app_metadata?: Record<string, unknown>
  } | null
) {
  if (!user) return true
  if (typeof user.is_anonymous === 'boolean') return user.is_anonymous
  return user.app_metadata?.provider === 'anonymous'
}

/**
 * Memastikan selalu ada sesi Supabase.
 *
 * - Host: boleh anonim (langsung bisa membuat quiz) atau login email.
 * - Pemain: selalu anonim, tidak perlu daftar.
 */
export function useSession(): SessionState {
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(true)
  const [email, setEmail] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nonce, setNonce] = useState(0)

  const refresh = useCallback(() => setNonce((n) => n + 1), [])

  useEffect(() => {
    let alive = true

    // Tanpa konfigurasi Supabase, jangan coba menghubungi apa pun —
    // langsung tampilkan pesan yang bisa dimengerti.
    if (!isSupabaseConfigured) {
      setError(
        'Database Supabase belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di file .env.local, lalu restart server.'
      )
      setReady(true)
      return
    }

    const timeout = window.setTimeout(() => {
      if (!alive) return
      setReady(true)
      setError(
        'Tidak dapat menghubungi Supabase. Periksa koneksi internet dan nilai di .env.local.'
      )
    }, 12000)

    const run = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        let session = data.session

        if (!session) {
          const { data: created, error: signInError } =
            await supabase.auth.signInAnonymously()
          if (signInError) throw signInError
          session = created.session
        }

        if (!alive) return
        setUserId(session?.user.id ?? null)
        setIsAnonymous(isAnonymousUser(session?.user))
        setEmail(session?.user.email ?? null)
        setError(null)
      } catch (caught) {
        if (!alive) return
        const message =
          caught instanceof Error ? caught.message : 'Gagal membuat sesi'
        setError(message)
      } finally {
        window.clearTimeout(timeout)
        if (alive) setReady(true)
      }
    }

    run()

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!alive) return
        setUserId(session?.user.id ?? null)
        setIsAnonymous(isAnonymousUser(session?.user))
        setEmail(session?.user.email ?? null)
      }
    )

    return () => {
      alive = false
      listener.subscription.unsubscribe()
    }
  }, [nonce])

  return { ready, userId, isAnonymous, email, error, refresh }
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  if (error) throw new Error(error.message)
  // Kalau "Confirm email" masih aktif di Supabase, sesi belum terbentuk.
  return { needsConfirmation: !data.session }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

/** Buat nickname acak yang lucu untuk pemain yang malas mengetik. */
export function randomNicknames() {
  const adjectives = [
    'Cepat', 'Pintar', 'Gigih', 'Ceria', 'Tenang', 'Lincah', 'Hebat', 'Jitu',
    'Sigap', 'Teliti', 'Kreatif', 'Brilian',
  ]
  const animals = [
    'Harimau', 'Elang', 'Rubah', 'Panda', 'Lumba', 'Kancil', 'Rajawali',
    'Kucing', 'Serigala', 'Merak', 'Koi', 'Banteng',
  ]
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    animals[Math.floor(Math.random() * animals.length)]
  }`
}
