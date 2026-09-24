'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { FormEvent, Suspense, useEffect, useState } from 'react'
import { PIN_LENGTH } from '@/constants'
import { getGameByPin, joinGame } from '@/lib/game'
import { randomNicknames, useSession } from '@/lib/use-session'
import { Alert, Button, Input, Logo, Spinner } from '@/components/ui'

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <JoinShell>
          <div className="flex justify-center py-10">
            <Spinner className="h-7 w-7 text-white/70" />
          </div>
        </JoinShell>
      }
    >
      <JoinFlow />
    </Suspense>
  )
}

function JoinFlow() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { ready, userId, error: sessionError } = useSession()

  const [step, setStep] = useState<'pin' | 'nickname'>('pin')
  const [pin, setPin] = useState(() =>
    (searchParams.get('pin') ?? '').replace(/\D/g, '').slice(0, PIN_LENGTH)
  )
  const [nickname, setNickname] = useState('')
  const [gameId, setGameId] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kalau URL sudah berisi PIN (mis. dari scan QR), langsung lanjut ke nickname.
  useEffect(() => {
    const fromUrl = (searchParams.get('pin') ?? '')
      .replace(/\D/g, '')
      .slice(0, PIN_LENGTH)
    if (fromUrl.length === PIN_LENGTH) {
      void checkPin(fromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function checkPin(value: string) {
    setChecking(true)
    setError(null)
    try {
      const game = await getGameByPin(value)
      if (!game) {
        setError('PIN tidak ditemukan. Cek lagi ya, atau minta PIN baru ke host.')
        setStep('pin')
        return
      }
      if (game.phase === 'result') {
        setError('Permainan dengan PIN ini sudah selesai. Minta host membuat ruangan baru.')
        setStep('pin')
        return
      }
      setGameId(game.id)
      setStep('nickname')
      setNickname((current) => current || randomNicknames())
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Terjadi kesalahan')
    } finally {
      setChecking(false)
    }
  }

  const onPinSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (pin.length !== PIN_LENGTH) {
      setError(`PIN harus ${PIN_LENGTH} angka`)
      return
    }
    void checkPin(pin)
  }

  const onNicknameSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!gameId || !userId) return

    setJoining(true)
    setError(null)
    try {
      await joinGame({ gameId, userId, nickname })
      window.sessionStorage.setItem(`bscquiz:nickname:${pin}`, nickname.trim())
      router.push(`/play/${pin}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Gagal bergabung')
      setJoining(false)
    }
  }

  return (
    <JoinShell>
      {step === 'pin' ? (
        <form onSubmit={onPinSubmit} className="animate-pop">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Gabung permainan
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Masukkan PIN {PIN_LENGTH} angka yang tampil di layar host.
          </p>

          <Input
            value={pin}
            onChange={(event) =>
              setPin(event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))
            }
            inputMode="numeric"
            autoFocus
            placeholder="000000"
            aria-label="PIN ruangan"
            className="mt-6 h-16 border-white/20 bg-white/10 text-center font-display text-3xl font-extrabold tracking-[0.35em] text-white placeholder:text-white/25 focus:border-white/50 focus:ring-white/10"
          />

          <Button
            type="submit"
            size="xl"
            block
            className="mt-4"
            loading={checking}
            disabled={pin.length !== PIN_LENGTH}
          >
            Lanjut
          </Button>

          <p className="mt-6 text-center text-sm text-white/60">
            Ingin jadi host?{' '}
            <Link
              href="/host/dashboard"
              className="font-semibold text-white underline decoration-white/40 underline-offset-4 hover:decoration-white"
            >
              Buat kuis sendiri
            </Link>
          </p>
        </form>
      ) : (
        <form onSubmit={onNicknameSubmit} className="animate-pop">
          <button
            type="button"
            onClick={() => {
              setStep('pin')
              setError(null)
            }}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white"
          >
            ← Ganti PIN
          </button>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            Pilih nickname
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Nama ini akan tampil di papan skor. PIN{' '}
            <span className="font-bold tracking-widest text-white">{pin}</span>
          </p>

          <Input
            value={nickname}
            onChange={(event) => setNickname(event.target.value.slice(0, 20))}
            autoFocus
            maxLength={20}
            placeholder="Nama kamu"
            aria-label="Nickname"
            className="mt-6 h-14 border-white/20 bg-white/10 text-center font-display text-xl font-bold text-white placeholder:text-white/25 focus:border-white/50 focus:ring-white/10"
          />

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-white/45">
              {nickname.length}/20 karakter
            </span>
            <button
              type="button"
              onClick={() => setNickname(randomNicknames())}
              className="text-xs font-semibold text-white/70 hover:text-white"
            >
              🎲 Acak nama
            </button>
          </div>

          <Button
            type="submit"
            size="xl"
            block
            className="mt-4"
            loading={joining}
            disabled={!ready || nickname.trim().length < 2}
          >
            {ready ? 'Masuk ruangan' : 'Menyiapkan…'}
          </Button>
        </form>
      )}

      {(error || sessionError) && (
        <Alert tone="error" className="mt-5">
          {error ?? sessionError}
        </Alert>
      )}

      {!pin && step === 'pin' && (
        <p className="mt-5 text-center text-xs text-white/40">
          Tips: minta host menampilkan QR code, lalu scan untuk masuk otomatis.
        </p>
      )}
    </JoinShell>
  )
}

function JoinShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-0 h-96 w-96 rounded-full bg-violet-600/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl"
      />

      <Link href="/" className="relative mb-8">
        <Logo tone="light" />
      </Link>

      <div className="relative w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur sm:p-8">
        {children}
      </div>
    </div>
  )
}
