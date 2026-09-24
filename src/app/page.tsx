import Link from 'next/link'
import { JoinBox } from '@/components/JoinBox'
import { ButtonLink, Logo } from '@/components/ui'

const FEATURES = [
  {
    title: 'Buat kuis dalam hitungan menit',
    body: 'Tambahkan soal, atur waktu menjawab dan poin, tandai jawaban benar. Tanpa batas jumlah soal.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
      </svg>
    ),
  },
  {
    title: 'Pemain gabung pakai PIN',
    body: 'Cukup buka tautan di HP, masukkan PIN 6 angka dan nickname. Tidak perlu bikin akun.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m1.5-3a4.5 4.5 0 0 0-4.5-4.5M6 15.75h12M6 19.5h12M4.5 12h15" />
      </svg>
    ),
  },
  {
    title: 'Skor realtime & podium',
    body: 'Grafik jawaban muncul langsung di layar host, skor pemain naik seketika, diakhiri podium juara.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 20.25h18M6.75 20.25V9.75m5.25 10.5V4.5m5.25 15.75V13.5" />
      </svg>
    ),
  },
  {
    title: 'Ramah HP & desktop',
    body: 'Layar host tampil lebar di laptop/proyektor, tombol jawaban besar dan enak ditap di ponsel.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.7} stroke="currentColor" className="h-5 w-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5h3m-9 21h15a1.5 1.5 0 0 0 1.5-1.5V3a1.5 1.5 0 0 0-1.5-1.5h-15A1.5 1.5 0 0 0 3 3v18a1.5 1.5 0 0 0 1.5 1.5Z" />
      </svg>
    ),
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur safe-top">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <ButtonLink href="/host/dashboard" variant="ghost" size="sm">
              Kuis saya
            </ButtonLink>
            <ButtonLink href="/host/dashboard" size="sm">
              Buat kuis
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-40 h-96 w-96 rounded-full bg-violet-200/50 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-10 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:pb-24 lg:pt-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
              Gratis · Open source · Tanpa iklan
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Bikin kuis seru,
              <br />
              main bareng
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent">
                {' '}
                seketika
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Alternatif Kahoot untuk kelas, rapat, atau kumpul keluarga. Host
              menampilkan soal, pemain menjawab dari HP masing-masing, skor
              muncul realtime.
            </p>

            <div className="mt-8 max-w-xl">
              <JoinBox />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-500">
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Tidak perlu install
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-sky-500" />
                Jalan di HP &amp; laptop
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                Data milik Anda sendiri
              </span>
            </div>
          </div>

          {/* Mock kartu soal */}
          <div className="lg:pt-6">
            <div className="relative mx-auto max-w-md">
              <div className="rotate-[-1.5deg] rounded-3xl border border-slate-200 bg-slate-900 p-5 shadow-2xl shadow-slate-900/20">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Soal 3 dari 10</span>
                  <span className="inline-flex items-center gap-1.5 text-violet-300">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-400" />
                    LIVE
                  </span>
                </div>
                <h3 className="mt-4 rounded-2xl bg-white px-4 py-5 text-center font-display text-lg font-bold text-slate-900">
                  Siapakah member accounting paling ganteng?
                </h3>
                <div className="mt-4 grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Zainul', bg: 'bg-rose-500' },
                    { label: 'Arifin', bg: 'bg-sky-500' },
                    { label: 'Ipin', bg: 'bg-amber-400' },
                    { label: 'Zainul Arifin', bg: 'bg-emerald-500' },
                  ].map((option) => (
                    <div
                      key={option.label}
                      className={`${option.bg} rounded-xl px-3 py-4 text-center text-sm font-bold text-white`}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <span className="text-xs font-medium text-slate-300">
                    18 dari 24 pemain menjawab
                  </span>
                  <span className="font-display text-sm font-bold text-violet-300">
                    ⏱ 12
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-6 -right-3 rotate-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-xl sm:-right-6">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Peringkat 1
                </p>
                <p className="font-display text-sm font-bold text-slate-900">
                  Rahmat Wicaksono
                </p>
                <p className="text-xs font-semibold text-emerald-600">
                  +940 poin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Fitur */}
      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Semua yang dibutuhkan untuk kuis live
          </h2>
          <p className="mt-3 max-w-2xl text-slate-600">
            Ringan, cepat, dan bisa di-deploy gratis ke Vercel atau Netlify
            dengan database Supabase.
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                  {feature.icon}
                </div>
                <h3 className="mt-4 font-display text-base font-bold text-slate-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara pakai */}
      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                Cara main
              </h2>
              <ol className="mt-6 space-y-5">
                {[
                  {
                    title: 'Host membuat kuis',
                    body: 'Masuk ke dashboard, buat kuis baru, isi soal dan jawaban benarnya.',
                  },
                  {
                    title: 'Host membuka ruangan',
                    body: 'Klik "Mainkan", PIN 6 angka dan QR code otomatis muncul di layar.',
                  },
                  {
                    title: 'Pemain gabung dari HP',
                    body: 'Scan QR atau buka situs ini, masukkan PIN dan pilih nickname.',
                  },
                  {
                    title: 'Mulai dan lihat skornya',
                    body: 'Host menekan Mulai. Jawaban dihitung, grafik tampil, juara diumumkan.',
                  },
                ].map((step, index) => (
                  <li key={step.title} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-900 font-display text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {step.title}
                      </p>
                      <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
                        {step.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-violet-600 to-fuchsia-600 p-8 text-white shadow-xl">
              <h3 className="font-display text-xl font-extrabold">
                Siap bikin kuis pertama?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">
                Anda tidak perlu akun untuk memulai — cukup buat kuis dan
                bagikan PIN-nya. Login email tersedia kalau ingin kuis Anda
                tersimpan permanen.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <ButtonLink
                  href="/host/dashboard"
                  size="lg"
                  className="!bg-white !text-violet-700 shadow-lg hover:!bg-violet-50"
                >
                  Mulai buat kuis
                </ButtonLink>
                <ButtonLink
                  href="/join"
                  size="lg"
                  variant="dark"
                  className="!border-white/30"
                >
                  Gabung permainan
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <p>
            Dibuat dengan Next.js, Tailwind CSS, dan Supabase.{' '}
            <Link
              href="/host/dashboard/how-to"
              className="font-semibold text-violet-600 hover:text-violet-700"
            >
              Panduan host
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
