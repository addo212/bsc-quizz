-- ============================================================================
--  FILE INI DI-GENERATE OTOMATIS — JANGAN DIEDIT LANGSUNG.
--
--  Sumber asli : supabase/setup.sql
--  Regenerate  : npm run db:sync
--
--  Dipakai oleh Supabase CLI saat menjalankan stack lokal:
--      npx supabase start     (butuh Docker Desktop)
--      npx supabase db reset
--
--  Untuk Supabase Cloud, copy-paste isi supabase/setup.sql ke SQL Editor.
-- ============================================================================

-- ============================================================================
--  BSC Quiz — Setup Database untuk Supabase Cloud (Free Tier)
-- ============================================================================
--  Cara pakai:
--   1. Buka https://supabase.com/dashboard  ->  pilih project Anda
--   2. Masuk ke menu "SQL Editor"  ->  "New query"
--   3. Copy-paste SELURUH isi file ini, lalu klik "Run"
--   4. Selesai. Skrip ini aman dijalankan berulang kali (idempotent).
--
--  Skrip ini juga aman dijalankan di atas schema asli
--  `supabase-community/kahoot-alternative` karena semua perubahan
--  menggunakan "if not exists" / "drop policy if exists".
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. TABEL
-- ---------------------------------------------------------------------------

-- Kumpulan soal (quiz) -------------------------------------------------------
create table if not exists public.quiz_sets (
    id          uuid default gen_random_uuid() not null primary key,
    created_at  timestamptz default now() not null,
    name        text not null,
    description text
);

alter table public.quiz_sets
    add column if not exists user_id     uuid default auth.uid() references auth.users (id) on delete set null on update cascade,
    add column if not exists cover_color text    default 'violet' not null,
    add column if not exists is_public   boolean default true     not null;

-- Soal -----------------------------------------------------------------------
create table if not exists public.questions (
    id          uuid default gen_random_uuid() not null primary key,
    created_at  timestamptz default now() not null,
    body        text not null,
    image_url   text,
    "order"     smallint not null,
    quiz_set_id uuid not null references public.quiz_sets (id) on delete cascade on update cascade
);

alter table public.questions
    add column if not exists time_limit smallint default 20   not null,
    add column if not exists points     smallint default 1000 not null,
    -- 'choice' = pilihan ganda, 'text' = jawaban diketik pemain
    add column if not exists question_type text default 'choice' not null,
    -- kunci jawaban untuk soal bertipe 'text'
    add column if not exists text_answer text,
    -- true = wajib sama persis termasuk huruf besar/kecil
    add column if not exists text_exact boolean default false not null;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'questions_question_type_check'
    ) then
        alter table public.questions
            add constraint questions_question_type_check
            check (question_type in ('choice', 'text'));
    end if;
end $$;

-- Pilihan jawaban ------------------------------------------------------------
create table if not exists public.choices (
    id          uuid default gen_random_uuid() not null primary key,
    created_at  timestamptz default now() not null,
    question_id uuid not null references public.questions (id) on delete cascade on update cascade,
    body        text not null,
    is_correct  boolean default false not null
);

-- Sesi permainan -------------------------------------------------------------
create table if not exists public.games (
    id                        uuid default gen_random_uuid() not null primary key,
    created_at                timestamptz default now() not null,
    current_question_sequence smallint default 0 not null,
    is_answer_revealed        boolean default false not null,
    phase                     text default 'lobby' not null,
    quiz_set_id               uuid not null references public.quiz_sets (id) on delete cascade on update cascade
);

alter table public.games
    add column if not exists host_user_id uuid default auth.uid() references auth.users (id) on delete set null on update cascade,
    add column if not exists pin          text;

create unique index if not exists games_pin_key on public.games (pin);
create index if not exists games_quiz_set_id_idx on public.games (quiz_set_id);

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'check_game_phase'
    ) then
        alter table public.games
            add constraint check_game_phase check (phase in ('lobby', 'quiz', 'result'));
    end if;
end $$;

-- Pemain ---------------------------------------------------------------------
create table if not exists public.participants (
    id         uuid default gen_random_uuid() not null primary key,
    created_at timestamptz default now() not null,
    nickname   text not null,
    game_id    uuid not null references public.games (id) on delete cascade on update cascade,
    user_id    uuid default auth.uid() not null references auth.users (id) on delete cascade on update cascade
);

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'participants_game_id_user_id_key'
    ) then
        alter table public.participants
            add constraint participants_game_id_user_id_key unique (game_id, user_id);
    end if;
end $$;

-- Jawaban --------------------------------------------------------------------
create table if not exists public.answers (
    id             uuid default gen_random_uuid() not null primary key,
    created_at     timestamptz default now() not null,
    participant_id uuid default auth.uid() not null references public.participants (id) on delete cascade on update cascade,
    question_id    uuid not null references public.questions (id) on delete cascade on update cascade,
    score          smallint not null,
    choice_id      uuid references public.choices (id) on delete set null on update cascade
);

alter table public.answers
    add column if not exists time_taken_ms integer default 0 not null,
    add column if not exists choice_id uuid references public.choices (id) on delete set null on update cascade,
    -- jawaban yang diketik pemain, dipakai untuk soal bertipe 'text'
    add column if not exists free_text text;

-- Perbaikan: default lama `auth.uid()` salah (itu user id, bukan participant id).
-- Aplikasi selalu mengirim `participant_id` secara eksplisit.
alter table public.answers alter column participant_id drop default;

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'answers_participant_id_question_id_key'
    ) then
        alter table public.answers
            add constraint answers_participant_id_question_id_key unique (participant_id, question_id);
    end if;
end $$;

-- ---------------------------------------------------------------------------
-- 2. HELPER: tambah soal + pilihan sekaligus (dipakai seed / import JSON)
-- ---------------------------------------------------------------------------

create or replace function public.add_question (
    quiz_set_id uuid,
    body        text,
    "order"     int,
    choices     json[] -- [{"body": "Postgres", "is_correct": true}, ...]
) returns uuid language plpgsql as $$
declare
    v_question_id uuid;
    v_choice      json;
begin
    insert into public.questions (body, "order", quiz_set_id)
    values (add_question.body, add_question."order", add_question.quiz_set_id)
    returning id into v_question_id;

    foreach v_choice in array choices
    loop
        insert into public.choices (question_id, body, is_correct)
        values (v_question_id, v_choice ->> 'body', (v_choice ->> 'is_correct')::boolean);
    end loop;

    return v_question_id;
end;
$$ security invoker;

-- ---------------------------------------------------------------------------
-- 3. VIEW HASIL AKHIR (semua pemain muncul, termasuk skor 0)
--    View lama dari schema upstream dibuang dulu karena nama kolomnya berbeda.
-- ---------------------------------------------------------------------------

drop view if exists public.game_results;

create or replace view public.game_results as
select
    p.id                as participant_id,
    p.nickname          as nickname,
    g.id                as game_id,
    coalesce(sum(a.score), 0)::int                        as total_score,
    count(a.id)::int                                      as answered_count,
    coalesce(sum(case when a.score > 0 then 1 else 0 end), 0)::int as correct_count
from public.games g
join public.participants p on p.game_id = g.id
left join public.answers a on a.participant_id = p.id
group by g.id, p.id, p.nickname;

-- ---------------------------------------------------------------------------
-- 3b. PROFIL HOST & PERSETUJUAN AKUN
--
--     - Pemain memakai sesi ANONIM (tanpa email) -> tidak dibuatkan profil,
--       jadi tidak pernah terblokir.
--     - Host dengan akun (email/password ATAU Google) baru bisa membuat &
--       mengubah kuis setelah statusnya 'approved'.
--     - Tamu & akun yang belum disetujui tetap bisa membuka ruangan dari
--       kuis yang sudah ada.
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
    id          uuid primary key references auth.users (id) on delete cascade,
    email       text,
    full_name   text,
    avatar_url  text,
    provider    text    default 'email',
    status      text    default 'pending' not null,
    is_admin    boolean default false   not null,
    created_at  timestamptz default now() not null,
    reviewed_at timestamptz,
    reviewed_by uuid references auth.users (id) on delete set null
);

alter table public.profiles
    add column if not exists avatar_url text,
    add column if not exists provider   text default 'email';

do $$
begin
    if not exists (
        select 1 from pg_constraint where conname = 'profiles_status_check'
    ) then
        alter table public.profiles
            add constraint profiles_status_check
            check (status in ('pending', 'approved', 'rejected'));
    end if;
end $$;

-- Profil dibuat otomatis untuk SETIAP user baru yang punya email — termasuk
-- pendaftar lewat Google. Pendaftar pertama disetujui & jadi admin supaya
-- Anda tidak terkunci di luar; sisanya menunggu persetujuan.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = public, pg_temp as $$
declare
    v_first boolean;
begin
    if new.email is null then
        return new;
    end if;

    select not exists (select 1 from public.profiles) into v_first;

    insert into public.profiles
        (id, email, full_name, avatar_url, provider, status, is_admin)
    values (
        new.id,
        new.email,
        coalesce(
            new.raw_user_meta_data ->> 'full_name',
            new.raw_user_meta_data ->> 'name'
        ),
        nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
        coalesce(new.raw_app_meta_data ->> 'provider', 'email'),
        case when v_first then 'approved' else 'pending' end,
        v_first
    )
    on conflict (id) do nothing;

    return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Sekali saja saat pertama memasang skrip ini: akun email yang SUDAH ada
-- dianggap sudah disetujui, dan yang paling awal menjadi admin.
do $$
begin
    if not exists (select 1 from public.profiles) then
        insert into public.profiles (id, email, status, is_admin)
        select
            u.id,
            u.email,
            'approved',
            row_number() over (order by u.created_at) = 1
        from auth.users u
        where u.email is not null;
    end if;
end $$;

-- Fungsi bantu untuk kebijakan RLS.
-- SECURITY DEFINER penting: kebijakan pada tabel profiles sendiri memanggil
-- fungsi ini, dan tanpa definer akan terjadi rekursi tak berujung.
create or replace function public.is_approved(uid uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
    select exists (
        select 1 from public.profiles where id = uid and status = 'approved'
    )
$$;

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer
set search_path = public, pg_temp as $$
    select exists (
        select 1 from public.profiles where id = uid and is_admin
    )
$$;

grant execute on function public.is_approved(uuid) to anon, authenticated;
grant execute on function public.is_admin(uuid) to anon, authenticated;

-- RLS tabel profiles ---------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
    on public.profiles for select to authenticated
    using (id = auth.uid() or public.is_admin());

drop policy if exists "Admins can review profiles" on public.profiles;
create policy "Admins can review profiles"
    on public.profiles for update to authenticated
    using (public.is_admin()) with check (public.is_admin());

-- Sengaja TIDAK ada policy insert/update untuk user biasa, sehingga pendaftar
-- tidak bisa menaikkan statusnya sendiri atau mengangkat dirinya jadi admin.
-- Baris profil dibuat oleh trigger (SECURITY DEFINER) yang melewati RLS.

-- ---------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
--    Catatan: kebijakan di bawah ini dibuat permisif agar aplikasi langsung
--    jalan (host bisa membaca semua jawaban saat reveal, dsb).
--    Untuk versi yang lebih ketat lihat: supabase/hardening.sql
-- ---------------------------------------------------------------------------

alter table public.quiz_sets    enable row level security;
alter table public.questions    enable row level security;
alter table public.choices      enable row level security;
alter table public.games        enable row level security;
alter table public.participants enable row level security;
alter table public.answers      enable row level security;

-- quiz_sets ------------------------------------------------------------------
drop policy if exists "Quiz sets are viewable by everyone" on public.quiz_sets;
create policy "Quiz sets are viewable by everyone"
    on public.quiz_sets for select using (true);

drop policy if exists "Authenticated users can create quiz sets" on public.quiz_sets;
drop policy if exists "Approved hosts can create quiz sets" on public.quiz_sets;
create policy "Approved hosts can create quiz sets"
    on public.quiz_sets for insert to authenticated
    with check (public.is_approved() and auth.uid() = user_id);

drop policy if exists "Owners can update their quiz sets" on public.quiz_sets;
create policy "Owners can update their quiz sets"
    on public.quiz_sets for update to authenticated
    using (auth.uid() = user_id and public.is_approved())
    with check (auth.uid() = user_id and public.is_approved());

drop policy if exists "Owners can delete their quiz sets" on public.quiz_sets;
create policy "Owners can delete their quiz sets"
    on public.quiz_sets for delete to authenticated
    using (auth.uid() = user_id and public.is_approved());

-- questions ------------------------------------------------------------------
drop policy if exists "Questions are viewable by everyone" on public.questions;
create policy "Questions are viewable by everyone"
    on public.questions for select using (true);

drop policy if exists "Owners can manage questions" on public.questions;
create policy "Owners can manage questions"
    on public.questions for all to authenticated
    using (public.is_approved() and exists (
        select 1 from public.quiz_sets qs
        where qs.id = questions.quiz_set_id and qs.user_id = auth.uid()
    ))
    with check (public.is_approved() and exists (
        select 1 from public.quiz_sets qs
        where qs.id = questions.quiz_set_id and qs.user_id = auth.uid()
    ));

-- choices --------------------------------------------------------------------
drop policy if exists "Choices are viewable by everyone" on public.choices;
create policy "Choices are viewable by everyone"
    on public.choices for select using (true);

drop policy if exists "Owners can manage choices" on public.choices;
create policy "Owners can manage choices"
    on public.choices for all to authenticated
    using (public.is_approved() and exists (
        select 1 from public.questions q
        join public.quiz_sets qs on qs.id = q.quiz_set_id
        where q.id = choices.question_id and qs.user_id = auth.uid()
    ))
    with check (public.is_approved() and exists (
        select 1 from public.questions q
        join public.quiz_sets qs on qs.id = q.quiz_set_id
        where q.id = choices.question_id and qs.user_id = auth.uid()
    ));

-- games ----------------------------------------------------------------------
drop policy if exists "Choices are viewable by everyone" on public.games;
drop policy if exists "Games are viewable by everyone" on public.games;
create policy "Games are viewable by everyone"
    on public.games for select using (true);

drop policy if exists "Host can start a game" on public.games;
create policy "Host can start a game"
    on public.games for insert to authenticated with check (auth.uid() = host_user_id);

drop policy if exists "Host can update their games" on public.games;
create policy "Host can update their games"
    on public.games for update to authenticated
    using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);

drop policy if exists "Host can delete their games" on public.games;
create policy "Host can delete their games"
    on public.games for delete to authenticated using (auth.uid() = host_user_id);

-- participants ---------------------------------------------------------------
drop policy if exists "Participants are viewable by everyone." on public.participants;
create policy "Participants are viewable by everyone."
    on public.participants for select using (true);

drop policy if exists "Participants can insert theirselves" on public.participants;
create policy "Participants can insert theirselves"
    on public.participants for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Participants can delete theirselves" on public.participants;
create policy "Participants can delete theirselves"
    on public.participants for delete to authenticated using (auth.uid() = user_id);

-- answers --------------------------------------------------------------------
drop policy if exists "Answers are viewable by everyone." on public.answers;
create policy "Answers are viewable by everyone."
    on public.answers for select using (true);

drop policy if exists "Participants can insert their own answers" on public.answers;
create policy "Participants can insert their own answers"
    on public.answers for insert to authenticated
    with check (exists (
        select 1 from public.participants p
        where p.id = answers.participant_id and p.user_id = auth.uid()
    ));

-- Pemain mengirim jawaban tanpa skor; HOST yang menghitung & menuliskan skor.
drop policy if exists "Host can score answers" on public.answers;
create policy "Host can score answers"
    on public.answers for update to authenticated
    using (exists (
        select 1
        from public.participants p
        join public.games g on g.id = p.game_id
        where p.id = answers.participant_id
          and g.host_user_id = auth.uid()
    ))
    with check (exists (
        select 1
        from public.participants p
        join public.games g on g.id = p.game_id
        where p.id = answers.participant_id
          and g.host_user_id = auth.uid()
    ));

-- Dipakai tombol "Main lagi": bersihkan jawaban supaya PIN yang sama bisa dipakai ulang.
drop policy if exists "Host can reset answers" on public.answers;
create policy "Host can reset answers"
    on public.answers for delete to authenticated
    using (exists (
        select 1
        from public.participants p
        join public.games g on g.id = p.game_id
        where p.id = answers.participant_id
          and g.host_user_id = auth.uid()
    ));

-- ---------------------------------------------------------------------------
-- 5. REALTIME
-- ---------------------------------------------------------------------------

do $$
declare
    t text;
begin
    foreach t in array array['games', 'participants', 'answers']
    loop
        if not exists (
            select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = t
        ) then
            execute format('alter publication supabase_realtime add table public.%I', t);
        end if;
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 6. VERIFIKASI
-- ---------------------------------------------------------------------------
select
    'setup selesai' as status,
    (select count(*) from public.quiz_sets) as jumlah_quiz;
