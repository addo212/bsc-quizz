'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AccountMenu } from '@/components/AccountMenu'
import { ButtonLink, Logo } from '@/components/ui'
import { cn } from '@/lib/utils'

const NAV = [
  {
    label: 'Kuis Saya',
    href: '/host/dashboard',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
      </svg>
    ),
  },
  {
    label: 'Cara Pakai',
    href: '/host/dashboard/how-to',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === '/host/dashboard'
      ? pathname === '/host/dashboard' || pathname.startsWith('/host/quiz')
      : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header untuk mobile / tablet */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur lg:hidden">
        <div className="flex h-16 items-center justify-between gap-3 px-4">
          <Link href="/host/dashboard">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <ButtonLink href="/" variant="ghost" size="sm">
              Beranda
            </ButtonLink>
            <ButtonLink href="/host/dashboard?new=1" size="sm">
              + Kuis
            </ButtonLink>
            <AccountMenu compact />
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold transition',
                isActive(item.href)
                  ? 'bg-violet-50 text-violet-700'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <div className="flex">
        {/* Sidebar desktop */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 lg:flex">
          <Link href="/" className="px-3 pb-6">
            <Logo />
          </Link>

          <ButtonLink href="/host/dashboard?new=1" block size="md">
            + Buat kuis baru
          </ButtonLink>

          <nav className="mt-6 flex-1 space-y-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive(item.href)
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                )}
              >
                <span
                  className={cn(
                    isActive(item.href) ? 'text-violet-600' : 'text-slate-400'
                  )}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 space-y-3">
            <Link
              href="/join"
              className="block rounded-xl bg-slate-900 px-4 py-3 text-white transition hover:bg-slate-800"
            >
              <span className="block text-xs font-semibold uppercase tracking-wider text-white/50">
                Jadi pemain?
              </span>
              <span className="mt-0.5 block text-sm font-bold">
                Gabung pakai PIN →
              </span>
            </Link>
            <AccountMenu />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
