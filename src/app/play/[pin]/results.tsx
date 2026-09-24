'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'
import useWindowSize from 'react-use/lib/useWindowSize'
import { getGameResults } from '@/lib/game'
import { GameResult } from '@/types/types'
import { cn, formatNumber } from '@/lib/utils'
import { Avatar } from '@/components/player-chip'
import { ButtonLink, Logo, Spinner } from '@/components/ui'

const MEDALS = ['🥇', '🥈', '🥉']

export function PlayerResults({
  gameId,
  participantId,
  nickname,
}: {
  gameId: string
  participantId: string
  nickname: string
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

  const myIndex =
    results?.findIndex((row) => row.participant_id === participantId) ?? -1
  const me = myIndex >= 0 ? results?.[myIndex] : null
  const podium = myIndex >= 0 && myIndex < 3
  const top = results?.slice(0, 5) ?? []

  return (
    <div className="relative flex min-h-screen flex-col items-center bg-slate-950 px-4 py-10">
      {podium && <Confetti width={width} height={height} recycle={false} numberOfPieces={260} />}

      <div className="w-full max-w-md">
        <div className="flex justify-center">
          <Logo tone="light" />
        </div>

        {!results ? (
          <div className="mt-16 flex justify-center">
            <Spinner className="h-8 w-8 text-white/60" />
          </div>
        ) : (
          <>
            <div className="mt-10 text-center">
              <Avatar name={nickname} size="lg" className="mx-auto" />
              <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-white/50">
                Permainan selesai
              </p>
              <h1 className="font-display text-3xl font-extrabold tracking-tight text-white">
                {myIndex >= 0 ? `Peringkat ${myIndex + 1}` : 'Terima kasih!'}
              </h1>
              {me && (
                <p className="mt-2 font-display text-xl font-extrabold text-violet-300">
                  {formatNumber(me.total_score ?? 0)} poin
                </p>
              )}
              {me && (
                <p className="mt-1 text-sm text-white/60">
                  {me.correct_count ?? 0} jawaban benar dari {me.answered_count ?? 0}{' '}
                  soal dijawab
                </p>
              )}
            </div>

            {top.length > 0 && (
              <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Papan atas
                </p>
                <ol className="space-y-2">
                  {top.map((row, index) => (
                    <li
                      key={row.participant_id}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2',
                        row.participant_id === participantId
                          ? 'bg-violet-500/20 ring-1 ring-violet-400/40'
                          : 'bg-white/5'
                      )}
                    >
                      <span className="w-6 text-center text-sm font-bold text-white/70">
                        {MEDALS[index] ?? index + 1}
                      </span>
                      <Avatar name={row.nickname ?? '?'} size="sm" />
                      <span className="flex-1 truncate text-sm font-semibold text-white">
                        {row.nickname}
                      </span>
                      <span className="font-display text-sm font-extrabold tabular-nums text-violet-200">
                        {formatNumber(row.total_score ?? 0)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <div className="mt-8">
              <ButtonLink href="/" block size="lg">
                Kembali ke halaman utama
              </ButtonLink>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
