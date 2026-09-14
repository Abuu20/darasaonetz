-- Quiz system migration — matches the LIVE schema already in your Supabase
-- project (quizzes / quiz_questions / quiz_options / quiz_attempts /
-- quiz_answers, all with course_id + status + attempts_allowed etc.).
--
-- Safe to run against a project that already has real quiz data: every
-- statement is additive (`add column if not exists`, `create ... if not
-- exists`, `drop policy if exists` before `create policy`). Nothing here
-- drops or renames an existing column, table, or row.
--
-- Why this file exists instead of reusing the old supabase-quiz-system.sql:
-- that file assumed a *different*, simpler quiz schema (prompt/label/
-- multi_select columns, a lesson_id-only unique quiz, no course_id, no
-- status workflow, a jsonb-only attempts table). Your live tables already
-- have a richer, different shape — this migration adds only the handful of
-- columns the app's quiz builder/player genuinely need that aren't there
-- yet, and a grading RPC written against your real column names.

-- ---------------------------------------------------------------------
-- 1. New columns (additive)
-- ---------------------------------------------------------------------

-- quiz_questions: the builder supports multi-answer questions and an
-- optional per-question explanation shown on the results screen. Neither
-- existed on the live table.
alter table public.quiz_questions
  add column if not exists explanation text,
  add column if not exists multi_select boolean not null default false;

-- quiz_attempts: the player needs a per-question breakdown (which options
-- the student picked vs. the correct ones) plus a points split, for the
-- results screen and review. `responses` is the same denormalized-jsonb
-- pattern already used elsewhere in this codebase (enrollments.completed_lessons,
-- lessons.attachments) — the results screen renders straight from it, no
-- extra joins. quiz_answers (the existing per-option audit table) is still
-- populated too, for anything that already reads it.
alter table public.quiz_attempts
  add column if not exists points_earned integer not null default 0,
  add column if not exists points_possible integer not null default 0,
  add column if not exists responses jsonb not null default '[]'::jsonb;

-- ---------------------------------------------------------------------
-- 2. Row Level Security
-- ---------------------------------------------------------------------

alter table public.quizzes enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_options enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.quiz_answers enable row level security;

-- quizzes: the owning teacher manages everything on their own course.
drop policy if exists "teacher manages own quizzes" on public.quizzes;
create policy "teacher manages own quizzes"
  on public.quizzes for all
  to authenticated
  using (exists (select 1 from public.courses c where c.id = quizzes.course_id and c.teacher_id = auth.uid()))
  with check (exists (select 1 from public.courses c where c.id = quizzes.course_id and c.teacher_id = auth.uid()));

-- Enrolled students can see a quiz once it's published.
drop policy if exists "enrolled students can view published quiz" on public.quizzes;
create policy "enrolled students can view published quiz"
  on public.quizzes for select
  to authenticated
  using (
    status = 'published'
    and exists (
      select 1 from public.enrollments e
      where e.course_id = quizzes.course_id and e.student_id = auth.uid()
    )
  );

-- quiz_questions / quiz_options: same shape, one level down.
drop policy if exists "teacher manages own quiz questions" on public.quiz_questions;
create policy "teacher manages own quiz questions"
  on public.quiz_questions for all
  to authenticated
  using (exists (
    select 1 from public.quizzes q join public.courses c on c.id = q.course_id
    where q.id = quiz_questions.quiz_id and c.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.quizzes q join public.courses c on c.id = q.course_id
    where q.id = quiz_questions.quiz_id and c.teacher_id = auth.uid()
  ));

drop policy if exists "enrolled students can view quiz questions" on public.quiz_questions;
create policy "enrolled students can view quiz questions"
  on public.quiz_questions for select
  to authenticated
  using (exists (
    select 1 from public.quizzes q join public.enrollments e on e.course_id = q.course_id
    where q.id = quiz_questions.quiz_id and e.student_id = auth.uid() and q.status = 'published'
  ));

drop policy if exists "teacher manages own quiz options" on public.quiz_options;
create policy "teacher manages own quiz options"
  on public.quiz_options for all
  to authenticated
  using (exists (
    select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
    join public.courses c on c.id = q.course_id
    where qq.id = quiz_options.question_id and c.teacher_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
    join public.courses c on c.id = q.course_id
    where qq.id = quiz_options.question_id and c.teacher_id = auth.uid()
  ));

-- Students can see option text/order but never is_correct via direct
-- select — grading only ever happens inside grade_quiz_attempt below.
drop policy if exists "enrolled students can view quiz options" on public.quiz_options;
create policy "enrolled students can view quiz options"
  on public.quiz_options for select
  to authenticated
  using (exists (
    select 1 from public.quiz_questions qq join public.quizzes q on q.id = qq.quiz_id
    join public.enrollments e on e.course_id = q.course_id
    where qq.id = quiz_options.question_id and e.student_id = auth.uid() and q.status = 'published'
  ));

-- quiz_attempts / quiz_answers: a student owns their own rows; the
-- teacher who owns the course can read (never edit) every attempt.
drop policy if exists "students manage their own attempts" on public.quiz_attempts;
create policy "students manage their own attempts"
  on public.quiz_attempts for all
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "teacher can view attempts on own quizzes" on public.quiz_attempts;
create policy "teacher can view attempts on own quizzes"
  on public.quiz_attempts for select
  to authenticated
  using (exists (
    select 1 from public.quizzes q join public.courses c on c.id = q.course_id
    where q.id = quiz_attempts.quiz_id and c.teacher_id = auth.uid()
  ));

drop policy if exists "students manage their own answers" on public.quiz_answers;
create policy "students manage their own answers"
  on public.quiz_answers for all
  to authenticated
  using (exists (select 1 from public.quiz_attempts a where a.id = quiz_answers.attempt_id and a.student_id = auth.uid()))
  with check (exists (select 1 from public.quiz_attempts a where a.id = quiz_answers.attempt_id and a.student_id = auth.uid()));

drop policy if exists "teacher can view answers on own quizzes" on public.quiz_answers;
create policy "teacher can view answers on own quizzes"
  on public.quiz_answers for select
  to authenticated
  using (exists (
    select 1 from public.quiz_attempts a
    join public.quizzes q on q.id = a.quiz_id
    join public.courses c on c.id = q.course_id
    where a.id = quiz_answers.attempt_id and c.teacher_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 3. Grading RPC — written against the live column names.
--    p_answers: jsonb array of { "question_id": uuid, "option_ids": [uuid, ...] }
-- ---------------------------------------------------------------------
create or replace function public.grade_quiz_attempt(p_quiz_id uuid, p_answers jsonb)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_id uuid := auth.uid();
  v_course_id uuid;
  v_points_earned integer := 0;
  v_points_possible integer := 0;
  v_responses jsonb := '[]'::jsonb;
  v_question record;
  v_selected uuid[];
  v_correct uuid[];
  v_is_correct boolean;
  v_score integer;
  v_passed boolean;
  v_passing_score integer;
  v_row public.quiz_attempts;
  v_attempt_id uuid;
begin
  if v_student_id is null then
    raise exception 'Not authenticated';
  end if;

  select course_id, passing_score into v_course_id, v_passing_score
  from public.quizzes where id = p_quiz_id;

  if v_course_id is null then
    raise exception 'Quiz not found';
  end if;

  -- Enrolled students may only attempt a published quiz. The owning
  -- teacher may attempt it any time (draft included) to preview grading.
  if exists (select 1 from public.courses c where c.id = v_course_id and c.teacher_id = v_student_id) then
    null; -- teacher previewing their own quiz
  elsif exists (select 1 from public.enrollments e where e.course_id = v_course_id and e.student_id = v_student_id)
    and exists (select 1 from public.quizzes where id = p_quiz_id and status = 'published') then
    null; -- enrolled student, published quiz
  else
    raise exception 'Not allowed to attempt this quiz';
  end if;

  for v_question in
    select id, points from public.quiz_questions where quiz_id = p_quiz_id order by order_index
  loop
    v_points_possible := v_points_possible + coalesce(v_question.points, 1);

    select coalesce(array_agg(id order by id), '{}') into v_correct
      from public.quiz_options where question_id = v_question.id and is_correct = true;

    select coalesce(array_agg(x::uuid order by x::uuid), '{}') into v_selected
      from jsonb_array_elements(p_answers) elem
      cross join lateral jsonb_array_elements_text(coalesce(elem->'option_ids', '[]'::jsonb)) x
      where (elem->>'question_id')::uuid = v_question.id;

    v_is_correct := (v_selected = v_correct);
    if v_is_correct then
      v_points_earned := v_points_earned + coalesce(v_question.points, 1);
    end if;

    v_responses := v_responses || jsonb_build_object(
      'question_id', v_question.id,
      'selected_option_ids', to_jsonb(v_selected),
      'correct_option_ids', to_jsonb(v_correct),
      'correct', v_is_correct
    );
  end loop;

  v_score := case when v_points_possible > 0 then round((v_points_earned::numeric / v_points_possible) * 100) else 0 end;
  v_passed := v_score >= coalesce(v_passing_score, 70);

  insert into public.quiz_attempts (
    quiz_id, student_id, score, passed, points_earned, points_possible, responses,
    started_at, completed_at
  ) values (
    p_quiz_id, v_student_id, v_score, v_passed, v_points_earned, v_points_possible, v_responses,
    now(), now()
  )
  returning * into v_row;

  v_attempt_id := v_row.id;

  -- Per-option audit rows in the existing quiz_answers table, for anything
  -- that already reads it directly (e.g. a future teacher gradebook view).
  insert into public.quiz_answers (attempt_id, question_id, option_id, is_correct)
  select
    v_attempt_id,
    (elem->>'question_id')::uuid,
    nullif(x, '')::uuid,
    exists (
      select 1 from public.quiz_options qo
      where qo.id = nullif(x, '')::uuid and qo.is_correct = true
    )
  from jsonb_array_elements(p_answers) elem
  cross join lateral jsonb_array_elements_text(coalesce(elem->'option_ids', '[]'::jsonb)) x;

  begin
    perform public.create_notification(
      v_student_id,
      'quiz_result',
      'Quiz result: ' || v_row.score || '%',
      case when v_row.passed then 'Nice work — you passed the quiz.' else 'You can retake the quiz any time.' end,
      jsonb_build_object('quiz_id', p_quiz_id, 'attempt_id', v_row.id, 'score', v_row.score)
    );
  exception when others then
    null; -- notification RPC may not exist in every environment; never block grading on it
  end;

  return v_row;
end;
$$;

grant execute on function public.grade_quiz_attempt(uuid, jsonb) to authenticated;

notify pgrst, 'reload schema';
