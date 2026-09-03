-- Fixes: clicking a notification (new_lesson, quiz_result, enrollment,
-- new_review, etc.) sometimes lands on "This course could not be found."
--
-- Root cause: `courses` almost certainly has a select policy like
--   status = 'published' OR teacher_id = auth.uid()
-- which is correct for browsing/marketing pages, but too narrow for a
-- student who is genuinely enrolled: if a teacher ever moves a course out
-- of "published" (edits it back to draft, it gets rejected on review,
-- etc.), every OLD notification pointing at that course_id becomes
-- unreadable for enrolled students — RLS hides the row, the app's
-- `.getById()` gets zero rows back, and CourseDetail correctly (if
-- unhelpfully) shows its not-found state.
--
-- This adds one more allowed case: a student who is actually enrolled in
-- the course can always view it, regardless of its current status. Run
-- this once in the Supabase SQL editor. It's additive — it does not
-- remove or replace whatever select policy already exists.

drop policy if exists "enrolled students can view their course" on public.courses;

create policy "enrolled students can view their course"
  on public.courses for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments e
      where e.course_id = courses.id
        and e.student_id = auth.uid()
    )
  );

-- Optional but recommended: if a course is permanently deleted (not just
-- unpublished), any notifications still pointing at it are dead links no
-- matter what RLS allows. If you want those to disappear on their own
-- instead of piling up, add a trigger that deletes email_notifications
-- rows whose data->>'course_id' matches a course being deleted:
--
-- create or replace function public.cleanup_course_notifications()
-- returns trigger as $$
-- begin
--   delete from public.email_notifications
--   where data->>'course_id' = old.id::text;
--   return old;
-- end;
-- $$ language plpgsql security definer;
--
-- drop trigger if exists trg_cleanup_course_notifications on public.courses;
-- create trigger trg_cleanup_course_notifications
--   before delete on public.courses
--   for each row execute function public.cleanup_course_notifications();

notify pgrst, 'reload schema';
