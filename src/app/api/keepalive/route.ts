import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Route ringan untuk "keep-alive" project Supabase Free.
 *
 * Project Supabase gratis akan di-pause setelah 1 minggu tanpa aktivitas.
 * Route ini dipanggil otomatis oleh Vercel Cron (lihat `vercel.json`) sekali
 * sehari untuk membuat sedikit aktivitas API.
 *
 * Catatan jujur: ini membantu, tetapi bukan jaminan 100% — kalau project tetap
 * ter-pause, cukup buka dashboard Supabase lalu klik "Restore project"
 * (data tidak hilang).
 */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    return NextResponse.json(
      { ok: false, reason: 'Supabase belum dikonfigurasi' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch(`${url}/rest/v1/quiz_sets?select=id&limit=1`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      cache: 'no-store',
    })

    return NextResponse.json({
      ok: response.ok,
      status: response.status,
      checkedAt: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'request gagal',
        checkedAt: new Date().toISOString(),
      },
      { status: 502 }
    )
  }
}
