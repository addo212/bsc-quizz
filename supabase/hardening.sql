-- ============================================================================
--  BSC Quiz — Hardening (OPSIONAL)
-- ============================================================================
--  Jalankan SETELAH supabase/setup.sql, hanya jika Anda ingin memperketat
--  keamanan:
--
--   1. Pemain tidak bisa lagi mengintip kunci jawaban lewat DevTools.
--      Soal & pilihan dibaca pemain melalui fungsi `get_game_questions`
--      yang menyembunyikan kolom `is_correct` sampai jawaban di-reveal.
--   2. Pemain hanya bisa melihat jawaban miliknya sendiri (host melihat semua).
--   3. Hasil akhir hanya bisa dibaca semua orang ketika permainan selesai.
--
--  Aplikasi sudah didesain agar tetap berjalan baik sebelum maupun sesudah
--  skrip ini dijalankan (ada fallback otomatis ke pembacaan tabel langsung).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Soal untuk pemain (tanpa kunci jawaban)
-- ---------------------------------------------------------------------------
create or replace function public.get_game_questions(p_game_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    with g as (
        select id, quiz_set_id, is_answer_revealed, current_question_sequence
        from public.games
        where id = p_game_id
    ),
    revealed as (
        select
            (select is_answer_revealed from g) as is_revealed,
            (select current_question_sequence from g) as current_seq
    )
    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'id',       q.id,
                'body',     q.body,
                'image_url', q.image_url,
                'order',    q."order",
                'time_limit', q.time_limit,
                'points',   q.points,
                'question_type', coalesce(q.question_type, 'choice'),
                'text_exact',    coalesce(q.text_exact, false),
                -- kunci jawaban hanya dikirim saat jawaban sudah di-reveal
                'text_answer',
                    case
                        when r.is_revealed and q."order" = r.current_seq
                            then q.text_answer
                        else null
                    end,
                'choices',  (
                    select coalesce(jsonb_agg(
                        jsonb_build_object(
                            'id',   c.id,
                            'body', c.body,
                            'is_correct',
                                case
                                    when r.is_revealed and q."order" = r.current_seq
                                        then c.is_correct
                                    else null
                                end
                        ) order by c.created_at
                    ), '[]'::jsonb)
                    from public.choices c
                    where c.question_id = q.id
                )
            )
            order by q."order"
        ),
        '[]'::jsonb
    )
    from public.questions q
    join g on g.quiz_set_id = q.quiz_set_id
    cross join revealed r;
$$;

grant execute on function public.get_game_questions(uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2. Kunci jawaban terkunci di level tabel
--    (hanya owner quiz / service_role yang boleh baca tabel mentah)
-- ---------------------------------------------------------------------------
drop policy if exists "Questions are viewable by everyone" on public.questions;
create policy "Owners can read their questions"
    on public.questions for select to authenticated
    using (exists (
        select 1 from public.quiz_sets qs
        where qs.id = questions.quiz_set_id and qs.user_id = auth.uid()
    ));

drop policy if exists "Choices are viewable by everyone" on public.choices;
create policy "Owners can read their choices"
    on public.choices for select to authenticated
    using (exists (
        select 1 from public.questions q
        join public.quiz_sets qs on qs.id = q.quiz_set_id
        where q.id = choices.question_id and qs.user_id = auth.uid()
    ));

-- ---------------------------------------------------------------------------
-- 3. Jawaban: pemain hanya melihat miliknya, host melihat semua
-- ---------------------------------------------------------------------------
drop policy if exists "Answers are viewable by everyone." on public.answers;
drop policy if exists "Participants can insert their own answers" on public.answers;
drop policy if exists "Players see own answers, host sees all" on public.answers;
create policy "Players see own answers, host sees all"
    on public.answers for select to authenticated
    using (
        exists (
            select 1 from public.participants p
            where p.id = answers.participant_id and p.user_id = auth.uid()
        )
        or exists (
            select 1
            from public.participants p
            join public.games g on g.id = p.game_id
            where p.id = answers.participant_id
              and g.host_user_id = auth.uid()
        )
        -- setelah permainan selesai, semua boleh melihat (untuk halaman hasil)
        or exists (
            select 1
            from public.participants p
            join public.games g on g.id = p.game_id
            where p.id = answers.participant_id
              and g.phase = 'result'
        )
    );

create policy "Participants can insert their own answers"
    on public.answers for insert to authenticated
    with check (exists (
        select 1 from public.participants p
        where p.id = answers.participant_id and p.user_id = auth.uid()
    ));

-- ---------------------------------------------------------------------------
-- 4. View hasil: hormati RLS tabel di bawahnya
-- ---------------------------------------------------------------------------
alter view public.game_results set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 5. Cabut akses tulis langsung ke kolom kecil yang tidak dipakai
-- ---------------------------------------------------------------------------
revoke all on function public.add_question(uuid, text, int, json[]) from anon, authenticated;

select 'hardening selesai' as status;
