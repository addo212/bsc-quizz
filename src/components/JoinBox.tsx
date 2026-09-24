'use client'

import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { PIN_LENGTH } from '@/constants'
import { Button, Input } from '@/components/ui'

/** Kotak "Gabung permainan" — dipakai di halaman utama. */
export function JoinBox() {
  const router = useRouter()
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    const clean = pin.replace(/\D/g, '')
    if (clean.length !== PIN_LENGTH) {
      setError(`PIN harus ${PIN_LENGTH} angka`)
      return
    }
    setError(null)
    router.push(`/join?pin=${clean}`)
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <Input
          value={pin}
          onChange={(event) =>
            setPin(event.target.value.replace(/\D/g, '').slice(0, PIN_LENGTH))
          }
          inputMode="numeric"
          autoComplete="off"
          placeholder="PIN Ruangan"
          aria-label="PIN ruangan"
          className="h-14 flex-1 text-center text-lg font-bold tracking-[0.4em] sm:text-left sm:tracking-[0.5em]"
        />
        <Button type="submit" size="xl" className="sm:w-auto">
          Gabung
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm font-medium text-rose-600">{error}</p>
      )}
      <p className="mt-2.5 text-xs text-slate-500">
        Minta PIN 6 angka dari host yang menampilkan layar permainan.
      </p>
    </form>
  )
}
