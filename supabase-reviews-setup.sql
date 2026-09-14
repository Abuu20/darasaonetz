-- Course reviews — run once in Supabase SQL Editor.
-- Adds a `course_reviews` table (one review per student per course,
-- editable in place — a student updates their existing row rather than
-- stacking duplicates, same pattern Udemy/Coursera use) and a trigger that
-- keeps `courses.rating` / `courses.review_count` in sync automatically,
-- so every place that already reads `course.rating` (cards, course page)
-- keeps working with zero changes to that read path.

create table if not exists public.course_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create index if not exists course_reviews_course_id_idx on public.course_reviews (course_id);

alter table public.courses add column if not exists review_count integer not null default 0;

alter table public.course_reviews enable row level security;

-- Anyone can read reviews (public social proof, same as a course's rating).
drop policy if exists "anyone can read reviews" on public.course_reviews;
create policy "anyone can read reviews"
  on public.course_reviews for select
  to anon, authenticated
  using (true);

-- Only a student enrolled in the course can review it, and only as themselves.
drop policy if exists "enrolled students can review" on public.course_reviews;
create policy "enrolled students can review"
  on public.course_reviews for insert
  to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.course_id = course_reviews.course_id
        and e.student_id = auth.uid()
    )
  );

drop policy if exists "students can edit their own review" on public.course_reviews;
create policy "students can edit their own review"
  on public.course_reviews for update
  to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "students can delete their own review" on public.course_reviews;
create policy "students can delete their own review"
  on public.course_reviews for delete
  to authenticated
  using (student_id = auth.uid());

-- Recompute the parent course's average rating + count whenever a review
-- is added, edited, or removed, so the catalog/course-page badge is never
-- stale and never needs its own aggregate query.
create or replace function public.recalc_course_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_course_id uuid := coalesce(new.course_id, old.course_id);
begin
  update public.courses
  set
    rating = coalesce((select round(avg(rating)::numeric, 2) from public.course_reviews where course_id = target_course_id), 0),
    review_count = coalesce((select count(*) from public.course_reviews where course_id = target_course_id), 0)
  where id = target_course_id;
  return null;
end;
$$;

drop trigger if exists course_reviews_recalc_insert on public.course_reviews;
create trigger course_reviews_recalc_insert
  after insert on public.course_reviews
  for each row execute function public.recalc_course_rating();

drop trigger if exists course_reviews_recalc_update on public.course_reviews;
create trigger course_reviews_recalc_update
  after update on public.course_reviews
  for each row execute function public.recalc_course_rating();

drop trigger if exists course_reviews_recalc_delete on public.course_reviews;
create trigger course_reviews_recalc_delete
  after delete on public.course_reviews
  for each row execute function public.recalc_course_rating();

notify pgrst, 'reload schema';
