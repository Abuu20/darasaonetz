-- ============================================================================
-- Course comments — run once in Supabase SQL Editor.
-- ============================================================================
-- One row per comment. `parent_id` makes it a threaded reply (a student
-- asks a top-level question, the teacher replies underneath). No depth
-- cap enforced — the UI only renders one level of nesting to keep it
-- readable, but a reply-to-reply is a valid row.

create table if not exists public.course_comments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.course_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists course_comments_course_idx on public.course_comments (course_id, created_at desc);
create index if not exists course_comments_parent_idx on public.course_comments (parent_id);

alter table public.course_comments enable row level security;

-- Anyone enrolled in the course can read comments on it, and the course's
-- own teacher can too. This is a superset of the "public" case — a
-- signed-out visitor cannot read comments.
drop policy if exists "enrolled can read course comments" on public.course_comments;
create policy "enrolled can read course comments"
  on public.course_comments for select
  to authenticated
  using (
    exists (
      select 1 from public.enrollments e
      where e.course_id = course_comments.course_id
        and e.student_id = auth.uid()
    )
    or exists (
      select 1 from public.courses c
      where c.id = course_comments.course_id
        and c.teacher_id = auth.uid()
    )
  );

-- Post as yourself, on a course you're enrolled in or teach.
drop policy if exists "enrolled or teacher can post comments" on public.course_comments;
create policy "enrolled or teacher can post comments"
  on public.course_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and (
      exists (
        select 1 from public.enrollments e
        where e.course_id = course_comments.course_id
          and e.student_id = auth.uid()
      )
      or exists (
        select 1 from public.courses c
        where c.id = course_comments.course_id
          and c.teacher_id = auth.uid()
      )
    )
  );

-- Only the author can edit their own comment. Teacher can't silently
-- rewrite what a student said — they reply instead.
drop policy if exists "authors can edit own comments" on public.course_comments;
create policy "authors can edit own comments"
  on public.course_comments for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

-- Author or the course teacher can delete.
drop policy if exists "authors or teacher can delete comments" on public.course_comments;
create policy "authors or teacher can delete comments"
  on public.course_comments for delete
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.courses c
      where c.id = course_comments.course_id
        and c.teacher_id = auth.uid()
    )
  );

-- Keep updated_at honest without a trigger — the app already sets it,
-- but this catches anything that bypasses the client.
create or replace function public.touch_course_comment()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists course_comment_touch on public.course_comments;
create trigger course_comment_touch
  before update on public.course_comments
  for each row execute function public.touch_course_comment();

notify pgrst, 'reload schema';
