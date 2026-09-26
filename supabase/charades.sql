-- ============================================================================
--  BSC Quiz — Mode "TEBAK KATA" (charades) — OPSIONAL
-- ============================================================================
--  Jalankan SEKALI di Supabase -> SQL Editor (tempel seluruh isi file ini).
--
--  Mode ini untuk permainan gaya tebak kata / peragaan:
--    * Satu tim = satu HP (nama tim dipakai sebagai nickname pemain).
--    * Layar HP menampilkan KATA KUNCI + GAMBAR kepada PEMERAGA.
--      Penebak tidak melihat layar dan menebak dengan suara.
--    * Pemegang HP menekan BENAR (+1 poin) atau SALAH (0 poin).
--    * Semua tim bermain BERSAMAAN dalam satu babak berdurasi tetap.
--    * Soal DIBAGI RATA tanpa tumpang tindih: setiap tim mendapat daftar
--      katanya sendiri, jadi tidak ada dua tim yang mendapat kata sama.
--    * Setiap kata boleh punya KATEGORI. Di lobby host bisa memilih pembagian
--      "Campur rata per kategori" supaya tiap tim mendapat campuran seimbang
--      dari semua kategori (mis. 2 Hewan + 2 Benda + 1 Perbuatan).
--
--  Tanpa menjalankan file ini aplikasi tetap jalan seperti biasa (mode klasik),
--  hanya tombol "Tebak Kata" yang tidak bisa dipakai.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Mode permainan disimpan di kuis (agar editor tahu cara memvalidasi soal)
-- ---------------------------------------------------------------------------
alter table public.quiz_sets
    add column if not exists game_mode text not null default 'classic';

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'quiz_sets_game_mode_check'
    ) then
        alter table public.quiz_sets
            add constraint quiz_sets_game_mode_check
            check (game_mode in ('classic', 'charades'));
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Kolom babak pada sesi permainan
--    round_started_at = jam bersama semua tim, supaya timer tidak melenceng
-- ---------------------------------------------------------------------------
alter table public.games
    add column if not exists mode             text     not null default 'classic',
    add column if not exists round_time_limit smallint not null default 60,
    add column if not exists current_round    smallint not null default 0,
    add column if not exists round_started_at timestamptz;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'games_mode_check'
    ) then
        alter table public.games
            add constraint games_mode_check check (mode in ('classic', 'charades'));
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Kategori kata + pembagian soal per tim
--    question_ids = daftar soal milik tim tersebut, berurutan sesuai giliran.
--    Daftar ini ditulis host saat menekan "Bagi soal & mulai", dan bisa
--    "dicampur" antar kategori (lihat pilihan pembagian di lobby).
--    Posisi kata saat ini TIDAK disimpan di sini, melainkan dihitung dari
--    jumlah baris `answers` milik tim -> pemain tidak bisa mengubahnya sendiri.
-- ---------------------------------------------------------------------------
alter table public.questions
    add column if not exists category text;

alter table public.participants
    add column if not exists team_index   smallint,
    add column if not exists question_ids uuid[] not null default '{}';

-- Versi awal memakai rentang soal berurutan. Sekarang digantikan oleh
-- `question_ids` supaya pembagian antar kategori bisa dicampur.
alter table public.participants
    drop column if exists question_start,
    drop column if exists question_count;

-- ---------------------------------------------------------------------------
-- 4. RLS: host boleh membagi tim, pemain tetap hanya boleh baca
-- ---------------------------------------------------------------------------
drop policy if exists "Host can arrange teams" on public.participants;
create policy "Host can arrange teams"
    on public.participants for update to authenticated
    using (exists (
        select 1 from public.games g
        where g.id = participants.game_id and g.host_user_id = auth.uid()
    ))
    with check (exists (
        select 1 from public.games g
        where g.id = participants.game_id and g.host_user_id = auth.uid()
    ));

select 'mode tebak kata siap' as status;
