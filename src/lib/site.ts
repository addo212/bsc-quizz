/**
 * URL publik aplikasi — dipakai untuk membuat tautan gabung & QR code.
 *
 * Urutan prioritas:
 *  1. Kalau `NEXT_PUBLIC_SITE_URL` berisi alamat asli (domain/IP), pakai itu.
 *  2. Kalau kosong ATAU masih menunjuk localhost, pakai alamat browser saat ini.
 *
 * Poin (2) penting: pemain membuka aplikasi dari HP, jadi alamat `localhost`
 * tidak ada gunanya bagi mereka. Dengan aturan ini, QR code otomatis benar
 * selama host membuka dashboard lewat alamat LAN — berapa pun port yang
 * dipakai Next.js dan walau `NEXT_PUBLIC_SITE_URL` lupa diubah.
 */
export function getSiteUrl() {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (origin && (!configured || isLocalhostUrl(configured))) {
    return origin
  }

  return configured || origin
}

function isLocalhostUrl(value: string) {
  try {
    const { hostname } = new URL(value)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]'
    )
  } catch {
    return false
  }
}

export function joinUrl(pin: string) {
  return `${getSiteUrl()}/join?pin=${pin}`
}
