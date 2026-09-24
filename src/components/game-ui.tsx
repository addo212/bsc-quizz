'use client'

import { useEffect, useRef, useState } from 'react'
import { ANSWER_STYLES } from '@/constants'
import { cn } from '@/lib/utils'

/**
 * Lingkaran countdown tanpa dependency eksternal.
 * Menghitung dari `durationMs` secara lokal, jadi halus di semua device.
 */
export function CountdownRing({
  durationMs,
  onComplete,
  startKey,
  size = 96,
  pause = false,
  tone = 'light',
}: {
  durationMs: number
  onComplete?: () => void
  startKey?: string | number
  size?: number
  pause?: boolean
  tone?: 'light' | 'dark'
}) {
  const [remaining, setRemaining] = useState(durationMs)
  const startedAtRef = useRef<number>(Date.now())
  const completedRef = useRef(false)
  const onCompleteRef = useRef(onComplete)

  onCompleteRef.current = onComplete

  useEffect(() => {
    startedAtRef.current = Date.now()
    completedRef.current = false
    setRemaining(durationMs)
  }, [startKey, durationMs])

  useEffect(() => {
    if (pause) return
    let raf = 0

    const tick = () => {
      const elapsed = Date.now() - startedAtRef.current
      const left = Math.max(0, durationMs - elapsed)
      setRemaining(left)

      if (left <= 0 && !completedRef.current) {
        completedRef.current = true
        onCompleteRef.current?.()
        return
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [durationMs, pause, startKey])

  const progress = durationMs > 0 ? remaining / durationMs : 0
  const seconds = Math.ceil(remaining / 1000)
  const radius = size / 2 - 6
  const circumference = 2 * Math.PI * radius
  const danger = progress < 0.3

  const strokeColor = danger ? '#f43f5e' : tone === 'dark' ? '#a78bfa' : '#7c3aed'

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Sisa waktu ${seconds} detik`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="6"
          className={tone === 'dark' ? 'stroke-white/10' : 'stroke-slate-200'}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          stroke={strokeColor}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - progress)}
          style={{ transition: 'stroke 300ms linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'font-display text-2xl font-extrabold tabular-nums',
            danger
              ? 'text-rose-500'
              : tone === 'dark'
                ? 'text-white'
                : 'text-slate-800'
          )}
        >
          {seconds}
        </span>
      </div>
    </div>
  )
}

/** Bentuk geometris khas Kahoot untuk tombol jawaban. */
export function AnswerShape({
  index,
  className,
}: {
  index: number
  className?: string
}) {
  const shape = ANSWER_STYLES[index % ANSWER_STYLES.length].shape
  const common = cn('h-4 w-4 shrink-0', className)

  switch (shape) {
    case 'triangle':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M12 3 22 20H2L12 3Z" />
        </svg>
      )
    case 'diamond':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <path d="M12 2 22 12 12 22 2 12 12 2Z" />
        </svg>
      )
    case 'circle':
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <circle cx="12" cy="12" r="9" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" className={common} fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </svg>
      )
  }
}

export function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className={cn('h-5 w-5', className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  )
}

export function CrossIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      className={cn('h-5 w-5', className)}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  )
}
