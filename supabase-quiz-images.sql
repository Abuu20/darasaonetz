-- Adds image support to quizzes: a question can carry a diagram/photo, and
-- each answer option can too (useful for "which of these is X" questions
-- where the answer choices are themselves images, not just text labels).
-- Safe to re-run — every statement is additive.

-- 1. New columns.
alter table public.quiz_questions
  add column if not exists image_url text;

alter table public.quiz_options
  add column if not exists image_url text;

-- 2. New storage bucket, same pattern as lesson-attachments /
--    course-thumbnails. Public read (quiz images are only reachable by
--    students already enrolled in the course, same trust level as your
--    other course assets), authenticated write.
insert into storage.buckets (id, name, public)
values ('quiz-images', 'quiz-images', true)
on conflict (id) do nothing;

drop policy if exists "anyone can view quiz images" on storage.objects;
create policy "anyone can view quiz images"
  on storage.objects for select
  to public
  using (bucket_id = 'quiz-images');

drop policy if exists "authenticated users can upload quiz images" on storage.objects;
create policy "authenticated users can upload quiz images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'quiz-images');

drop policy if exists "authenticated users can delete quiz images" on storage.objects;
create policy "authenticated users can delete quiz images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'quiz-images');
