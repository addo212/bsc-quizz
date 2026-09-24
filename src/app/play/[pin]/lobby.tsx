'use client'

import { Avatar } from '@/components/player-chip'
import { Participant } from '@/types/types'

export function PlayerLobby({
  participant,
  pin,
  playerCount,
  totalQuestions,
  quizName,
  connecting,
  charades = false,
}: {
  participant: Participant
  pin: string
  playerCount: number
  totalQuestions: number
  quizName?: string
  connecting: boolean
  /** true = mode tebak kata: satu HP per tim. */
  charades?: boolean
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-5 py-10">
      <div className="w-full max-w-sm text-center">
        <Avatar name={participant.nickname} size="lg" />

        <h1 className="mt-5 font-display text-2xl font-extrabold tracking-tight text-white">
          Halo, {participant.nickname}!
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/60">
          {charades
            ? 'Tim kamu sudah masuk. Pegang satu HP ini — pemeraga melihat layar, penebak menebak dengan suara.'
            : 'Kamu sudah masuk ruangan. Lihat layar host — permainan akan segera dimulai.'}
        </p>

        {charades && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              🎭 Mode Tebak Kata
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-relaxed text-white/60">
              <li>• 1 tim = 1 HP. Nama di atas adalah nama tim kamu.</li>
              <li>• Tiap tim dapat kata yang berbeda, tidak ada yang sama.</li>
              <li>• Tekan BENAR (+1) atau LEWATI setiap kali kata selesai.</li>
            </ul>
          </div>
        )}

        {quizName && (
          <p className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-white/70">
            {quizName} · {totalQuestions} soal
          </p>
        )}

        <div className="mt-8 flex items-center justify-center gap-2.5">
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-300ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400 [animation-delay:-150ms]" />
          <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-violet-400" />
        </div>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-white/40">
          Menunggu host memulai
        </p>

        <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
            PIN ruangan
          </p>
          <p className="font-display text-3xl font-extrabold tracking-[0.3em] text-white">
            {pin}
          </p>
          <p className="mt-2 text-xs text-white/50">
            {connecting
              ? 'Menghubungkan…'
              : `${playerCount} ${charades ? 'tim' : 'pemain'} sudah bergabung`}
          </p>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/40">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Tetap buka halaman ini sampai permainan selesai
        </div>
      </div>
    </div>
  )
}
