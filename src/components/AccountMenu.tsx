'use client'

import { FormEvent, useState } from 'react'
import { signInWithEmail, signOut, signUpWithEmail, useSession } from '@/lib/use-session'
import { Avatar } from '@/components/player-chip'
import { Alert, Button, Field, Input, Modal } from '@/components/ui'

export function AccountMenu({ compact = false }: { compact?: boolean }) {
  const { ready, userId, isAnonymous, email, refresh } = useSession()
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
              {isAnonymous || !userId ? 'Klik untuk login' : 'Tersimpan permanen'}
            </span>
          </span>
        )}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={isAnonymous ? 'Masuk agar kuis tersimpan' : 'Akun Anda'}
        description={
          isAnonymous
            ? 'Sebagai tamu, kuis Anda hanya tersimpan di browser ini. Login dengan email supaya bisa dibuka dari device lain.'
            : 'Kuis yang Anda buat akan selalu bisa diakses.'
        }
      >
        {!isAnonymous && userId ? (
          <div className="space-y-4">
            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p className="text-slate-500">Masuk sebagai</p>
              <p className="font-semibold text-slate-900">{email}</p>
            </div>
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

            <p className="text-xs leading-relaxed text-slate-400">
              Catatan: fitur email memerlukan provider &quot;Email&quot; aktif di
              Supabase (Authentication → Providers). Kalau belum, tetap bisa
              memakai mode tamu seperti sekarang.
            </p>
          </form>
        )}
      </Modal>
    </>
  )
}
