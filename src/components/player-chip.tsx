'use client'

import { avatarColor, cn, initials } from '@/lib/utils'

export function Avatar({
  name,
  size = 'md',
  className,
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-20 w-20 text-2xl',
  }
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-2xl font-display font-extrabold text-white shadow-lg',
        avatarColor(name),
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      {initials(name) || '?'}
    </span>
  )
}

export function PlayerChip({
  nickname,
  compact = false,
  className,
}: {
  nickname: string
  compact?: boolean
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2.5 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm',
        compact && 'mx-auto w-fit',
        className
      )}
    >
      <Avatar name={nickname} size="sm" />
      <span className="pr-2 text-sm font-semibold text-slate-700">
        {nickname}
      </span>
    </div>
  )
}
