# BSC Quiz — Alternatif Kahoot (gratis & open source)

Aplikasi kuis live bergaya Kahoot: **host** menampilkan soal di layar besar,
**pemain** menjawab dari HP masing-masing lewat PIN 6 angka, dan skor muncul
secara realtime. Cocok untuk kelas, pelatihan, rapat, atau kumpul keluarga.

Dibangun di atas [kahoot-alternative](https://github.com/supabase-community/kahoot-alternative)
lalu dikembangkan dengan: halaman pembuatan kuis, PIN ruangan, QR code,
penilaian aman di sisi host, dan UI yang ramah HP maupun desktop.

## Stack

| Bagian | Teknologi | Biaya |
| --- | --- | --- |
| Frontend | Next.js 14 (App Router) + TypeScript | gratis |
| Styling | Tailwind CSS | gratis |
| Database & Realtime | Supabase (Postgres + Realtime) | gratis (free tier) |
| Hosting | Vercel atau Netlify | gratis |

> Supabase dipilih karena repo asal sudah memakainya dan **tidak perlu kartu
> kredit** pada free tier. Kalau Anda memang ingin Firebase, seluruh akses data
> sudah dikumpulkan di `src/lib/` sehingga mudah ditukar.

## Fitur

- **Halaman pembuatan kuis** — CRUD soal, 2–4 pilihan jawaban, penanda jawaban
  benar, waktu menjawab per soal, poin per soal, warna cover, gambar soal.
- **Impor & ekspor JSON** — backup atau bagi-bagi kuis dengan mudah.
- **PIN 6 angka + QR code** — pemain langsung masuk tanpa install apa pun.
- **Layar host** — timer besar, hitungan jawaban masuk, grafik batang sebaran
  jawaban, papan skor sementara.
- **Skor adil** — poin penuh kalau menjawab instan, separuh kalau mentok waktu.
  Skor dihitung di sisi host, bukan di HP pemain.
- **Podium juara + confetti** di akhir permainan, lengkap dengan tabel peringkat.
- **Main lagi** dengan PIN yang sama tanpa pemain harus rejoin.
- **Responsif** — layout host optimal di laptop/proyektor, layout pemain
  dirancang untuk jempol di layar HP.
- **Akun opsional** — host bisa langsung main sebagai tamu, atau login email
  agar kuis tersimpan permanen.

## Menjalankan di lokal

### Langkah 1 — Siapkan database

Pilih salah satu cara di bawah. Keduanya gratis dan hasilnya sama.

#### Cara A — Supabase Cloud *(disarankan: ± 3 menit, tanpa install apa pun)*

1. Daftar di [supabase.com](https://supabase.com) lalu **New project**.
   Pilih region terdekat (mis. Singapore), simpan password database.
2. Setelah project siap, buka **SQL Editor → New query**.
3. Buka file [`supabase/setup.sql`](supabase/setup.sql), copy seluruh isinya,
   tempel ke SQL Editor, lalu klik **Run**. Skrip ini membuat semua tabel,
   kebijakan keamanan (RLS), view hasil, dan mengaktifkan Realtime.
4. Aktifkan login tamu: **Authentication → Sign In / Providers → Anonymous**
   → aktifkan, lalu **Save**.
   *(Opsional)* Aktifkan provider **Email** kalau ingin host bisa login dengan
   email. Untuk kemudahan saat uji coba, matikan **Confirm email**.
5. Ambil kunci API: **Project Settings → API**, salin:
   - `Project URL`
   - `anon public` key

#### Cara B — Supabase lokal di komputer sendiri *(offline penuh)*

Cara ini memerlukan **Docker Desktop**, karena satu project Supabase =
beberapa container (Postgres, API/PostgREST, Auth, Realtime, Studio).
Cek dulu apakah Docker sudah ada: `docker --version`.

```bash
# 1. jalankan seluruh stack Supabase di komputer
npm run db:start        # = npx supabase start

# 2. lihat URL & kunci yang harus dipakai aplikasi
npm run db:status
```

Saat `db:start`, schema **terpasang otomatis** dari
[`supabase/migrations/`](supabase/migrations/) (file hasil sinkronisasi
`setup.sql`). Studio lokal ada di <http://127.0.0.1:54323>.

Perintah bantuan lain:

```bash
npm run db:stop     # matikan stack
npm run db:reset    # hapus data, pasang ulang schema + seed contoh
npm run db:sync     # regenerate migrasi setelah mengubah setup.sql
```

> Login tamu sudah otomatis aktif di stack lokal. Kalau perlu diubah manual:
> **Studio → Authentication → Providers → Anonymous**.

#### Perlu Laragon? Tidak — dan Laragon tidak bisa menggantikan Supabase

Laragon berisi web server (Nginx/Apache), PHP, dan MySQL/MariaDB. Bagus untuk
WordPress/Laravel, **tetapi tidak bisa dipakai untuk aplikasi ini**, karena:

- Aplikasi ini tidak pernah menyambung langsung ke database. Ia memanggil
  **REST API + WebSocket Realtime** milik Supabase (PostgREST, GoTrue,
  Realtime). Postgres telanjang saja tidak cukup, jadi MySQL/MariaDB Laragon
  tidak terpakai sama sekali.
- PostgreSQL bawaan Laragon (kalau Anda menginstalnya) juga belum cukup —
  tetap tidak ada lapisan API-nya.

Kombinasi yang benar untuk pengembangan lokal:

| Kebutuhan | Pakai apa |
| --- | --- |
| Menjalankan web-nya | `npm run dev` (Node.js, port 3000) |
| Database — online, gratis | **Cara A**: Supabase Cloud |
| Database — offline | **Cara B**: Supabase CLI + Docker Desktop |
| Laragon | Tidak diperlukan. Boleh tetap jalan; tidak ada bentrok port (Laragon memakai 80/3306/5432, Supabase lokal memakai 54321–54324). |

> **Ringkas:** untuk mencoba hari ini, pakai **Cara A**. Kalau nanti butuh
> benar-benar offline (mis. mengajar di kelas tanpa internet), instal Docker
> Desktop lalu pakai **Cara B**.

### Langkah 2 — Konfigurasi aplikasi

```bash
# 1. install dependency
npm install

# 2. salin template environment
copy .env.local.example .env.local     # Windows
# cp .env.local.example .env.local     # macOS / Linux
```

Isi `.env.local` sesuai cara yang Anda pilih.

**Kalau memakai Cara A (Supabase Cloud):**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Kalau memakai Cara B (Supabase lokal):** alamatnya selalu sama, hanya
kuncinya yang perlu disalin dari `npm run db:status`.

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<salin dari output `npm run db:status`>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> `NEXT_PUBLIC_SITE_URL` dipakai untuk membuat tautan & QR code "gabung
> permainan". Saat pemain mengakses lewat IP LAN (mis. dari HP ke
> `http://192.168.1.5:3000`), isi variabel ini dengan alamat tersebut supaya QR
> code mengarah ke tempat yang benar.

### Langkah 3 — Jalankan

```bash
npm run dev
```

Buka <http://localhost:3000>.

## Cara pakai singkat

1. Host membuka **/host/dashboard** → **+ Buat kuis baru** → isi soal → **Simpan**.
2. Klik **▶ Mainkan** pada kartu kuis. Ruangan terbuka dengan **PIN** dan **QR code**.
3. Pemain membuka alamat aplikasi di HP (atau scan QR) → masukkan PIN → pilih nickname.
4. Host menekan **▶ Mulai permainan**, soal muncul satu per satu, jawaban dibuka
   otomatis saat waktu habis atau ketika semua pemain sudah menjawab.
5. Di akhir, host menampilkan **podium juara**.

Panduan lebih detail (termasuk format impor JSON) ada di halaman
**Cara Pakai** di dalam aplikasi.

## Deploy gratis

### Vercel

1. Push repo ini ke GitHub.
2. Buka [vercel.com/new](https://vercel.com/new) → import repo. Vercel otomatis
   mengenali Next.js, tidak perlu ubah build command.
3. Di **Environment Variables**, tambahkan `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_SITE_URL`
   (isi dengan domain Vercel Anda, mis. `https://bsc-quiz.vercel.app`).
4. **Deploy**. Selesai.

### Netlify

Repo sudah menyertakan [`netlify.toml`](netlify.toml) dengan plugin Next.js.

1. Buka [app.netlify.com](https://app.netlify.com) → **Add new site → Import an
   existing project**.
2. Pilih repo. Build command `npm run build`, publish directory `.next` sudah
   terisi otomatis dari `netlify.toml`.
3. Tambahkan **environment variables** yang sama seperti di atas.
4. **Deploy**.

> Setelah deploy, jangan lupa perbarui `NEXT_PUBLIC_SITE_URL` agar QR code
> mengarah ke domain produksi, lalu redeploy sekali lagi.

## Struktur proyek

```
src/
├─ app/
│  ├─ page.tsx                    # Landing page + kotak gabung PIN
│  ├─ join/page.tsx               # Alur pemain masuk (PIN → nickname)
│  ├─ play/[pin]/                 # Layar pemain: lobby, soal, hasil
│  └─ host/
│     ├─ layout.tsx               # Shell dashboard (sidebar + menu akun)
│     ├─ dashboard/               # Daftar kuis + cara pakai (MDX)
│     ├─ quiz/[quizId]/           # Editor / pembuat kuis
│     └─ game/[pin]/              # Layar host: lobby, soal, hasil
├─ components/                    # Design system & komponen bersama
├─ lib/
│  ├─ quiz.ts                     # Akses data kuis (CRUD soal)
│  ├─ game.ts                     # Akses data permainan (room, jawaban, skor)
│  ├─ use-session.ts              # Sesi tamu/email Supabase
│  ├─ site.ts, utils.ts
├─ constants.ts                   # Warna, bentuk jawaban, aturan poin
└─ types/                         # Tipe Supabase + tipe domain
supabase/
├─ setup.sql                      # WAJIB dijalankan (schema + RLS + realtime)
├─ migrations/                    # dipakai otomatis oleh Supabase CLI (Cara B)
│  └─ ..._bsc_quiz_setup.sql      #   digenerate dari setup.sql via `npm run db:sync`
├─ hardening.sql                  # OPSIONAL, keamanan tambahan
└─ seed.sql                       # contoh kuis yang ikut dimuat di mode lokal
scripts/
└─ sync-supabase-migration.mjs    # penyalin setup.sql -> migrations/
```

## Model data

| Tabel | Isi |
| --- | --- |
| `quiz_sets` | Judul, deskripsi, pemilik, warna cover, publik/privat |
| `questions` | Soal, gambar, urutan, batas waktu, poin |
| `choices` | Pilihan jawaban + penanda `is_correct` |
| `games` | Satu sesi permainan: PIN, fase (`lobby`/`quiz`/`result`) |
| `participants` | Nickname pemain dalam satu sesi |
| `answers` | Jawaban pemain + waktu tempuh + skor |
| `game_results` (view) | Total skor, jumlah benar, jumlah dijawab per pemain |

## Keamanan (opsional)

Secara default, halaman memakai kebijakan RLS yang permisif supaya aplikasi
langsung jalan: pemain bisa membaca tabel `questions` dan `choices`, sehingga
secara teori kunci jawaban bisa diintip lewat DevTools oleh orang yang paham
teknis.

Kalau ingin lebih ketat, jalankan [`supabase/hardening.sql`](supabase/hardening.sql)
setelah `setup.sql`. Skrip itu:

- menyediakan fungsi `get_game_questions()` yang menyembunyikan `is_correct`
  sampai jawaban benar-benar di-reveal,
- membatasi pembacaan tabel `questions`/`choices` hanya untuk pemilik kuis,
- membuat pemain hanya bisa melihat jawabannya sendiri (host melihat semua).

Aplikasi otomatis memakai fungsi tersebut kalau ada, dan jatuh kembali ke
pembacaan tabel biasa kalau belum dipasang — jadi aman dijalankan kapan saja.

## Aturan penilaian

```
poin = points × (1 − 0,5 × waktu_jawab / batas_waktu)     // kalau benar
poin = 0                                                   // kalau salah
```

Artinya menjawab dalam sekejap memberi poin penuh, sedangkan menjawab tepat di
detik terakhir memberi separuh poin. Skor dihitung di sisi host setelah jawaban
dibuka, lalu dituliskan ke tabel `answers`.

## Skrip yang tersedia

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Server pengembangan |
| `npm run build` | Build produksi |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | ESLint |
| `npm run typecheck` | Cek tipe TypeScript |
| `npm run db:start` | Nyalakan Supabase lokal (butuh Docker) |
| `npm run db:stop` | Matikan Supabase lokal |
| `npm run db:status` | Tampilkan URL & kunci Supabase lokal |
| `npm run db:reset` | Pasang ulang schema + seed di Supabase lokal |
| `npm run db:sync` | Regenerate `supabase/migrations/` dari `setup.sql` |

## Pemecahan masalah

| Gejala | Penyebab & solusi |
| --- | --- |
| Muncul banner kuning "Belum terhubung ke database" | `.env.local` belum dibuat/diisi, atau server perlu di-restart setelah mengubah env. |
| `TypeError: Failed to fetch` di dashboard | Sama seperti di atas: `.env.local` masih kosong / URL Supabase belum benar. |
| Ingin offline total, `npm run db:start` gagal | Docker Desktop belum terpasang. Cek dengan `docker --version`, lalu instal dari [docker.com](https://www.docker.com/products/docker-desktop/). Tanpa Docker, pakai Cara A (Supabase Cloud). |
| `relation "quiz_sets" does not exist` | `supabase/setup.sql` belum dijalankan di SQL Editor (Cara A), atau `npm run db:reset` belum dijalankan (Cara B). |
| Gagal membuat sesi / tidak bisa gabung | Provider **Anonymous** belum diaktifkan di Authentication → Providers. |
| Perubahan pemain/pemain tidak realtime | Tabel belum masuk publication Realtime. Jalankan ulang `setup.sql` (bagian 5) atau aktifkan manual di Database → Replication. |
| Sudah login email tapi dashboard kosong | Kuis tamu dimiliki oleh user anonim yang berbeda, jadi tidak muncul di akun email. Kuis tetap bisa dilihat di tab **Semua kuis publik**. |
| Pemain kedua di HP yang sama tidak bisa masuk | Satu browser = satu identitas. Gunakan mode incognito atau HP lain. |
| HP tidak bisa membuka alamat dari QR code | Isi `NEXT_PUBLIC_SITE_URL` dengan alamat LAN komputer (mis. `http://192.168.1.5:3000`), restart `npm run dev`, lalu pastikan firewall Windows mengizinkan Node.js. |
| Apakah Laragon dipakai? | Tidak. Laragon (Nginx/Apache + PHP + MySQL) tidak bisa menggantikan Supabase karena aplikasi memanggil REST API + Realtime, bukan koneksi database langsung. Lihat penjelasan di [Langkah 1](#perlu-laragon-tidak--dan-laragon-tidak-bisa-menggantikan-supabase). |

## Lisensi

[MIT](LICENSE). Proyek turunan dari
[supabase-community/kahoot-alternative](https://github.com/supabase-community/kahoot-alternative).
