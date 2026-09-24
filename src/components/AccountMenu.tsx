'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import {
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from '@/lib/use-session'
import { useHostAccess } from '@/lib/use-host-access'
import { Avatar } from '@/components/player-chip'
import { Alert, Badge, Button, Field, Input, Modal } from '@/components/ui'

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const {
    ready,
    userId,
    isAnonymous,
    email,
    profile,
    statusLabel,
    isAdmin,
    canManageQuizzes,
    refresh,
  } = useHostAccess()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [emailInput, setEmailInput] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'info' | 'error' | 'success'; text: string } | null>(null)

  const label = !ready ? '…' : isAnonymous ? 'Tamu' : email ?? 'Akun'

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      if (mode === 'signin') {
        await signInWithEmail(emailInput.trim(), password)
        setMessage({ tone: 'success', text: 'Berhasil masuk!' })
        setOpen(false)
      } else {
        const result = await signUpWithEmail(emailInput.trim(), password)
        if (result.needsConfirmation) {
          setMessage({
            tone: 'info',
            text: 'Cek email Anda untuk konfirmasi, lalu login kembali.',
          })
        } else {
          setMessage({ tone: 'success', text: 'Akun dibuat!' })
          setOpen(false)
        }
      }
      setPassword('')
      refresh()
    } catch (caught) {
      setMessage({
        tone: 'error',
        text: caught instanceof Error ? caught.message : 'Terjadi kesalahan',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Akun"
        className={
          compact
            ? 'flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50'
            : 'flex w-full items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50'
        }
      >
        <Avatar name={label} size={compact ? 'sm' : 'md'} />
        {!compact && (
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-800">
              {label}
            </span>
            <span className="block text-[11px] text-slate-400">
              {isAnonymous || !userId ? 'Klik untuk login' : statusLabel}
            </span>
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isAnonymous ? 'Masuk sebagai host' : 'Akun Anda'}
        description={
          isAnonymous
            ? 'Sebagai tamu Anda tetap bisa memainkan kuis yang sudah ada, tetapi tidak bisa membuat kuis baru. Masuk dengan akun yang disetujui admin untuk mengelola kuis.'
            : 'Lihat status persetujuan akun Anda.'
        }
      >
        {!isAnonymous && userId ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-sm text-slate-500">Masuk sebagai</p>
              <p className="font-semibold text-slate-900">{email}</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge tone={statusTone(profile?.status, isAdmin)}>
                  {statusLabel}
                </Badge>
                {profile?.provider && (
                  <span className="text-xs text-slate-400">
                    via {profile.provider}
                  </span>
                )}
              </div>
            </div>

            {!canManageQuizzes && !isAdmin && (
              <Alert tone={profile?.status === 'rejected' ? 'error' : 'warning'}>
                {profile?.status === 'rejected'
                  ? 'Pendaftaran Anda ditolak. Hubungi admin kalau ini keliru.'
                  : 'Akun Anda menunggu persetujuan admin. Untuk sementara Anda tetap bisa membuka ruangan dari kuis yang sudah ada, tetapi belum bisa membuat kuis baru.'}
              </Alert>
            )}

            {canManageQuizzes && (
              <Alert tone="success">
                Akun Anda sudah disetujui — pembuatan & pengelolaan kuis terbuka.
              </Alert>
            )}

            {isAdmin && (
              <Link
                href="/host/admin"
                onClick={() => setOpen(false)}
                className="flex items-center justify-between rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 transition hover:bg-violet-100"
              >
                <span>
                  <span className="block text-sm font-semibold text-violet-800">
                    Halaman Admin
                  </span>
                  <span className="block text-xs text-violet-600">
                    Setujui atau tolak pendaftar baru
                  </span>
                </span>
                <span className="text-violet-500">→</span>
              </Link>
            )}

            <Button
              variant="secondary"
              block
              onClick={async () => {
                await signOut()
                refresh()
                setOpen(false)
              }}
            >
              Keluar
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
              {(['signin', 'signup'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${
                    mode === value
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {value === 'signin' ? 'Masuk' : 'Daftar'}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="secondary"
              block
              size="lg"
              onClick={async () => {
                setBusy(true)
                setMessage(null)
                try {
                  await signInWithGoogle()
                } catch (caught) {
                  setMessage({
                    tone: 'error',
                    text:
                      caught instanceof Error
                        ? caught.message
                        : 'Gagal masuk dengan Google',
                  })
                  setBusy(false)
                }
              }}
            >
              <GoogleIcon />
              Masuk dengan Google
            </Button>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs text-slate-400">atau lewat email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <Field label="Email">
              <Input
                type="email"
                required
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="nama@email.com"
                autoComplete="email"
              />
            </Field>

            <Field
              label="Password"
              hint={mode === 'signup' ? 'Minimal 6 karakter' : undefined}
            >
              <Input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </Field>

            {message && <Alert tone={message.tone}>{message.text}</Alert>}

            <Button type="submit" block size="lg" loading={busy}>
              {mode === 'signin' ? 'Masuk' : 'Buat akun'}
            </Button>

            <Alert tone="info">
              Akun baru — termasuk yang lewat Google — berstatus{' '}
              <strong>menunggu persetujuan admin</strong>. Anda bisa masuk, tetapi
              baru bisa membuat kuis setelah disetujui.
            </Alert>
          </form>
        )}
      </Modal>
    </>
  )
}

function statusTone(status: string | undefined, isAdmin: boolean) {
  if (isAdmin) return 'violet' as const
  if (status === 'approved') return 'emerald' as const
  if (status === 'rejected') return 'rose' as const
  if (status === 'pending') return 'amber' as const
  return 'slate' as const
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.54 5.54 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  )
}
