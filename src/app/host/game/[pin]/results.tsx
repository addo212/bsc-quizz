'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import { GameResult } from '@/types/types'
import { cn, formatNumber } from '@/lib/utils'
import { getGameResults } from '@/lib/game'
import { Avatar } from '@/components/player-chip'
import { Button, ButtonLink, EmptyState, Spinner } from '@/components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export function HostResults({
  gameId,
  quizName,
  onReplay,
  onExit,
  replaying,
  charades = false,
}: {
  gameId: string
  quizName: string
  onReplay: () => void
  onExit: () => void
  replaying: boolean
  /** true = mode tebak kata: satu peserta = satu tim. */
  charades?: boolean
}) {
  const { width, height } = useWindowSize()
  const [results, setResults] = useState<GameResult[] | null>(null)

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const data = await getGameResults(gameId)
        if (alive) setResults(data)
      } catch {
        if (alive) setResults([])
      }
    }
    load()
    return () => {
      alive = false
    }
  }, [gameId])

  const podium = results?.slice(0, 3) ?? []
  const rest = results?.slice(3) ?? []
  const order = [1, 0, 2] // tampilkan juara 2 - 1 - 3

  return (
    <div className="relative min-h-screen bg-slate-950 px-4 py-8 sm:px-8">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        numberOfPieces={300}
        colors={['#7c3aed', '#c026d3', '#38bdf8', '#fbbf24', '#34d399']}
      />

      <div className="relative mx-auto max-w-4xl">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
            Hasil akhir
          </p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {quizName}
          </h1>
        </div>

        {!results ? (
          <div className="mt-16 flex justify-center">
            <Spinner className="h-8 w-8 text-white/60" />
          </div>
        ) : results.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="Belum ada hasil"
              description={
                charades
                  ? 'Tidak ada tim yang menandai kata di permainan ini.'
                  : 'Tidak ada pemain yang menjawab di permainan ini.'
              }
            />
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="mt-10 flex items-end justify-center gap-3 sm:gap-6">
              {order.map((position) => {
                const row = podium[position]
                if (!row) return null
                const heights = ['h-24', 'h-36', 'h-20']
                const size = position === 0 ? 'lg' : 'md'
                return (
                  <div
                    key={row.participant_id}
                    className="flex w-24 flex-col items-center sm:w-36"
                  >
                    <span className="mb-2 text-2xl">
                      {MEDALS[position] ?? ''}
                    </span>
                    <Avatar name={row.nickname ?? '?'} size={size} />
                    <p className="mt-2 w-full truncate text-center text-sm font-bold text-white">
                      {row.nickname}
                    </p>
                    <p className="font-display text-sm font-extrabold text-violet-300">
                      {formatNumber(row.total_score ?? 0)}
                    </p>
                    <div
                      className={cn(
                        'mt-2 w-full rounded-t-2xl',
                        heights[position],
                        position === 0
                          ? 'bg-gradient-to-t from-violet-600 to-fuchsia-500'
                          : 'bg-gradient-to-t from-slate-700 to-slate-600'
                      )}
                    />
                  </div>
                )
              })}
            </div>

            {/* Sisanya */}
            {rest.length > 0 && (
              <div className="mt-10 overflow-hidden rounded-2xl border border-white/10">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-[11px] uppercase tracking-wider text-white/40">
                    <tr>
                      <th className="px-4 py-3 font-semibold">#</th>
                      <th className="px-4 py-3 font-semibold">
                        {charades ? 'Tim' : 'Pemain'}
                      </th>
                      <th className="px-4 py-3 text-right font-semibold">Benar</th>
                      <th className="px-4 py-3 text-right font-semibold">Poin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rest.map((row, index) => (
                      <tr
                        key={row.participant_id}
                        className="border-t border-white/5"
                      >
                        <td className="px-4 py-3 font-semibold text-white/40">
                          {index + 4}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-2.5">
                            <Avatar name={row.nickname ?? '?'} size="sm" />
                            <span className="truncate font-semibold text-white">
                              {row.nickname}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-white/60">
                          {row.correct_count ?? 0}/{row.answered_count ?? 0}
                        </td>
                        <td className="px-4 py-3 text-right font-display font-extrabold text-violet-200">
                          {formatNumber(row.total_score ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" onClick={onReplay} loading={replaying}>
            ↻ Main lagi dengan kuis ini
          </Button>
          <ButtonLink href="/host/dashboard" size="lg" variant="dark">
            Kembali ke dashboard
          </ButtonLink>
          <Button size="lg" variant="ghost" className="!text-white/60 hover:!bg-white/10 hover:!text-white" onClick={onExit}>
            Keluar
          </Button>
        </div>
      </div>
    </div>
  )
}
