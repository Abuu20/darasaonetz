-- ============================================================================
-- Regrade RPC — run once in Supabase SQL Editor.
-- ============================================================================
-- Lets the owning teacher override a quiz attempt's score with a note.
-- Only the teacher of the course the quiz belongs to can call this. The
-- student's `score` and `passed` fields are updated in place; the
-- original auto-graded score is preserved in a side table for audit.

create table if not exists public.quiz_regrades (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.quiz_attempts(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  old_score int not null,
  new_score int not null,
  feedback text,
  created_at timestamptz not null default now()
);

create index if not exists quiz_regrades_attempt_idx on public.quiz_regrades (attempt_id);

alter table public.quiz_regrades enable row level security;

-- Teachers can read their own regrades; students can read regrades on
-- their own attempts so the feedback shows up in the review screen.
drop policy if exists "teachers and students can read regrades" on public.quiz_regrades;
create policy "teachers and students can read regrades"
  on public.quiz_regrades for select
  to authenticated
  using (
    teacher_id = auth.uid()
    or exists (
      select 1 from public.quiz_attempts a
      where a.id = quiz_regrades.attempt_id
        and a.student_id = auth.uid()
    )
  );

-- All writes go through the RPC below; no direct insert policy.

create or replace function public.regrade_quiz_attempt(
  p_attempt_id uuid,
  p_new_score int,
  p_feedback text default null
)
returns public.quiz_attempts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_attempt public.quiz_attempts;
  v_course_id uuid;
  v_owns_course boolean;
  v_old_score int;
begin
  if v_teacher_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Look up the attempt + its course, then check ownership.
  select * into v_attempt from public.quiz_attempts where id = p_attempt_id;
  if v_attempt.id is null then
    raise exception 'Attempt not found';
  end if;

  select q.course_id into v_course_id
  from public.quizzes q
  where q.id = v_attempt.quiz_id;

  select exists (
    select 1 from public.courses c
    where c.id = v_course_id and c.teacher_id = v_teacher_id
  ) into v_owns_course;

  if not v_owns_course then
    raise exception 'Only the course teacher can regrade this attempt';
  end if;

  v_old_score := v_attempt.score;

  update public.quiz_attempts
  set
    score = least(100, greatest(0, p_new_score)),
    passed = least(100, greatest(0, p_new_score)) >= coalesce(
      (select passing_score from public.quizzes where id = v_attempt.quiz_id),
      70
    )
  where id = p_attempt_id
  returning * into v_attempt;

  insert into public.quiz_regrades (attempt_id, teacher_id, old_score, new_score, feedback)
  values (p_attempt_id, v_teacher_id, v_old_score, v_attempt.score, p_feedback);

  return v_attempt;
end;
$$;

grant execute on function public.regrade_quiz_attempt(uuid, int, text) to authenticated;

notify pgrst, 'reload schema';
