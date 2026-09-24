import Link from 'next/link'
import { JoinBox } from '@/components/JoinBox'
import { ButtonLink, Logo } from '@/components/ui'

const REPO_URL = 'https://github.com/supabase-community/kahoot-alternative'

/** Teks kecil di strip paling atas — penanda bahwa ini versi yang sudah disesuaikan. */
const EDITION_NOTE =
  'Edisi BSC Accounting 2026 · disesuaikan oleh addo dari kahoot-alternative (MIT)'

const SPECS = [
  {
    title: 'Pembuat kuis',
    body: 'Tulis soal, atur batas waktu dan poin, tandai jawaban benar, dan simpan sebagai draf. Bisa juga impor & ekspor lewat file JSON untuk backup atau berbagi antar panitia.',
  },
  {
    title: 'Dua tipe soal',
    body: 'Pilihan ganda untuk jawaban cepat, atau jawaban diketik yang harus sama dengan kunci — dengan opsi wajib sama persis bila huruf besar/kecil ikut dinilai.',
  },
  {
    title: 'PIN & QR ruangan',
    body: 'Setiap sesi punya PIN 6 angka dan QR code. Pemain cukup membuka tautan di HP, memasukkan PIN, memilih nickname — tidak perlu memasang apa pun.',
  },
  {
    title: 'Layar host',
    body: 'Timer besar, hitungan jawaban yang masuk, grafik sebaran jawaban saat dibuka, dan papan skor sementara yang naik seketika.',
  },
  {
    title: 'Podium & riwayat',
    body: 'Hasil akhir tampil sebagai podium juara dengan tabel peringkat lengkap, dan bisa dimainkan ulang memakai PIN yang sama.',
  },
  {
    title: 'Persetujuan akun host',
    body: 'Pemain tetap bebas tanpa akun. Akun host baru berstatus menunggu dan hanya bisa mengelola kuis setelah disetujui admin.',
  },
]

const STEPS = [
  {
    title: 'Siapkan kuis',
    body: 'Masuk sebagai host, buat kuis, lalu isi soal beserta jawabannya.',
  },
  {
    title: 'Buka ruangan',
    body: 'PIN 6 angka dan QR code muncul otomatis begitu ruangan dibuka.',
  },
  {
    title: 'Pemain bergabung',
    body: 'Scan QR atau buka situs ini, masukkan PIN, pilih nickname.',
  },
  {
    title: 'Mainkan & nilai',
    body: 'Host menekan mulai. Jawaban dinilai otomatis, juara diumumkan.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f6f5f1] text-slate-900">
      {/* Strip penanda edisi */}
      <div className="bg-[#0b1120] px-5 py-2.5 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/55">
          {EDITION_NOTE}
        </p>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-slate-900/10 bg-[#f6f5f1]/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/">
            <Logo />
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#spesifikasi" className="transition hover:text-slate-900">
              Fitur
            </a>
            <a href="#alur" className="transition hover:text-slate-900">
              Alur
            </a>
            <Link
              href="/host/dashboard/how-to"
              className="transition hover:text-slate-900"
            >
              Panduan
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/host/dashboard"
              className="hidden text-sm font-semibold text-slate-700 transition hover:text-slate-900 sm:block"
            >
              Kuis saya
            </Link>
            <ButtonLink href="/join" size="sm">
              Gabung
            </ButtonLink>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative border-b border-slate-900/10">
        <div className="mx-auto grid max-w-6xl gap-14 px-5 py-14 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-20 lg:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-violet-700">
              Kuis live · kelas &amp; rapat
            </p>

            <h1 className="mt-6 font-display text-[2.7rem] font-extrabold leading-[0.97] tracking-[-0.035em] sm:text-6xl lg:text-[4.1rem]">
              Bikin kuis,
              <br />
              bagikan PIN,
              <br />
              <span className="text-violet-600">lihat skornya</span>
            </h1>

            <p className="mt-7 max-w-lg text-base leading-relaxed text-slate-600">
              Host menampilkan soal di layar besar, pemain menjawab dari HP
              masing-masing. Tidak perlu instalasi, tidak perlu akun untuk
              pemain, dan tidak ada batas jumlah soal.
            </p>

            <div className="mt-9 max-w-md">
              <JoinBox />
            </div>

            <dl className="mt-11 grid max-w-md grid-cols-3 border-t border-slate-900/10 pt-6">
              {[
                { value: '6', label: 'angka PIN' },
                { value: '0', label: 'akun pemain' },
                { value: '∞', label: 'jumlah soal' },
              ].map((stat, index) => (
                <div
                  key={stat.label}
                  className={index > 0 ? 'border-l border-slate-900/10 pl-5' : ''}
                >
                  <dt className="font-display text-3xl font-extrabold tracking-tight">
                    {stat.value}
                  </dt>
                  <dd className="mt-1 text-xs leading-snug text-slate-500">
                    {stat.label}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Contoh soal — sengaja dipertahankan seperti semula */}
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

      {/* Spesifikasi fitur */}
      <section id="spesifikasi" className="border-b border-slate-900/10">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="max-w-lg font-display text-3xl font-extrabold leading-tight tracking-[-0.025em] sm:text-[2.6rem]">
              Semua yang dibutuhkan untuk satu sesi kuis
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-slate-600">
              Ringan, cepat, dan bisa di-hosting gratis di Vercel atau Netlify
              dengan database Supabase.
            </p>
          </div>

          <div className="mt-12 border-t border-slate-900/10">
            {SPECS.map((spec, index) => (
              <div
                key={spec.title}
                className="group grid gap-2 border-b border-slate-900/10 py-7 sm:grid-cols-[3.5rem_15rem_1fr] sm:gap-8 sm:py-8"
              >
                <span className="font-mono text-xs text-slate-400 transition group-hover:text-violet-600">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-display text-lg font-bold tracking-tight">
                  {spec.title}
                </h3>
                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
                  {spec.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Alur */}
      <section id="alur" className="bg-[#0b1120] text-white">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-violet-300">
            Alur permainan
          </p>
          <h2 className="mt-5 max-w-xl font-display text-3xl font-extrabold leading-tight tracking-[-0.025em] sm:text-[2.6rem]">
            Empat langkah, dari nol sampai podium
          </h2>

          <ol className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <li key={step.title} className="border-t border-white/15 pt-6">
                <span className="font-display text-4xl font-extrabold tracking-tight text-white/20">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-4 font-display text-base font-bold tracking-tight">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-14 flex flex-col gap-3 sm:flex-row">
            <ButtonLink
              href="/host/dashboard"
              size="lg"
              className="!bg-white !text-slate-900 shadow-lg hover:!bg-slate-100"
            >
              Mulai buat kuis
            </ButtonLink>
            <ButtonLink href="/join" size="lg" variant="dark">
              Gabung permainan
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* Kredit & footer */}
      <footer>
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <Logo />
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600">
                Versi yang disesuaikan untuk keperluan internal{' '}
                <strong className="font-semibold text-slate-800">
                  BSC Accounting 2026
                </strong>
                . Berjalan sepenuhnya di browser, data tersimpan di database
                milik sendiri.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-900/10 bg-white p-6 sm:p-7">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-slate-400">
                Kredit
              </p>

              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                Dibangun dari proyek open source{' '}
                <a
                  href={REPO_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="font-semibold text-violet-700 underline decoration-violet-300 underline-offset-4 transition hover:text-violet-800 hover:decoration-violet-500"
                >
                  supabase-community/kahoot-alternative
                </a>{' '}
                (lisensi MIT). Terima kasih kepada para pembuat aslinya atas
                pondasi proyek ini.
              </p>

              <p className="mt-4 text-sm leading-relaxed text-slate-700">
                Antarmuka, alur permainan, dan fitur di versi ini{' '}
                <strong className="font-semibold text-slate-900">
                  dikembangkan serta disesuaikan oleh addo
                </strong>{' '}
                untuk kebutuhan personal{' '}
                <strong className="font-semibold text-slate-900">
                  BSC Accounting 2026
                </strong>{' '}
                — termasuk PIN ruangan, mode soal jawaban diketik, penilaian di
                sisi host, dan persetujuan akun host oleh admin.
              </p>

              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                MIT License · Next.js · Tailwind CSS · Supabase
              </p>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-3 border-t border-slate-900/10 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <span>
              © 2026 BSC Accounting 2026 · diedit oleh{' '}
              <strong className="font-semibold text-slate-700">addo</strong>
            </span>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <Link
                href="/host/dashboard/how-to"
                className="font-semibold text-violet-700 transition hover:text-violet-800"
              >
                Panduan host →
              </Link>
              <a
                href={REPO_URL}
                target="_blank"
                rel="noreferrer noopener"
                className="font-semibold text-slate-600 transition hover:text-slate-900"
              >
                Sumber asli ↗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
