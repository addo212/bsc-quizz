'use client'

import { useQRCode } from 'next-qrcode'
import { Participant } from '@/types/types'
import { Avatar } from '@/components/player-chip'
import { Button } from '@/components/ui'
import { joinUrl } from '@/lib/site'

export function HostLobby({
  pin,
  quizName,
  totalQuestions,
  players,
  starting,
  onStart,
}: {
  pin: string
  quizName: string
  totalQuestions: number
  players: Participant[]
  starting: boolean
  onStart: () => void
}) {
  const { Canvas } = useQRCode()
  const url = joinUrl(pin)

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-6 sm:px-8 sm:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-violet-600/25 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-fuchsia-600/20 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-start lg:gap-12">
        {/* Kiri: PIN & QR */}
        <div className="w-full lg:w-[22rem] lg:shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Kuis
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white">
            {quizName}
          </h1>
          <p className="mt-1 text-sm text-white/50">
            {totalQuestions} soal · {players.length} pemain siap
          </p>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-center backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              PIN untuk gabung
            </p>
            <p className="mt-2 font-display text-5xl font-extrabold tracking-[0.2em] text-white sm:text-6xl">
              {pin}
            </p>
            <p className="mt-3 text-xs text-white/50">
              Buka {url || 'situs ini'} lalu masukkan PIN di atas
            </p>

            <div className="mt-5 flex justify-center rounded-2xl bg-white p-3">
              <Canvas
                text={url}
                options={{
                  errorCorrectionLevel: 'M',
                  margin: 1,
                  scale: 3,
                  width: 200,
                  color: { dark: '#0f172a', light: '#ffffff' },
                }}
              />
            </div>
            <p className="mt-3 text-xs text-white/50">
              Atau scan QR code ini dengan kamera HP
            </p>
          </div>

          <Button
            size="xl"
            block
            className="mt-6"
            onClick={onStart}
            loading={starting}
            disabled={players.length === 0 || totalQuestions === 0}
          >
            ▶ Mulai permainan
          </Button>
          {players.length === 0 && (
            <p className="mt-3 text-center text-xs text-white/40">
              Tunggu pemain masuk dulu ya…
            </p>
          )}
        </div>

        {/* Kanan: daftar pemain */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-lg font-extrabold text-white">
              Pemain di ruangan
            </h2>
            <span className="rounded-full bg-white/10 px-3 py-1 font-display text-sm font-bold text-white">
              {players.length}
            </span>
          </div>

          {players.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/[0.03] py-20 text-center">
              <div className="flex gap-2">
                <span className="h-3 w-3 animate-bounce rounded-full bg-violet-400 [animation-delay:-300ms]" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-violet-400 [animation-delay:-150ms]" />
                <span className="h-3 w-3 animate-bounce rounded-full bg-violet-400" />
              </div>
              <p className="mt-5 text-sm font-medium text-white/50">
                Belum ada pemain. Bagikan PIN {pin} atau QR code di samping.
              </p>
            </div>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex animate-pop items-center gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-2.5"
                >
                  <Avatar name={player.nickname} size="sm" />
                  <span className="truncate text-sm font-semibold text-white">
                    {player.nickname}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
