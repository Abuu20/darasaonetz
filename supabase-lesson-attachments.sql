-- Run this once in your Supabase project (SQL Editor) to enable lesson
-- attachments (PDFs, docs, images, links) — the "Resources" section now
-- rendered on the Learn page and manageable from the teacher dashboard.

-- 1. New column on the existing lessons table. Stored as jsonb: an array of
--    { id, name, url, type, size_bytes } objects — see LessonAttachment in
--    lib/db/types.ts. Nullable, so existing lessons with no attachments
--    need no backfill.
alter table public.lessons
  add column if not exists attachments jsonb;

-- 2. New storage bucket, alongside the existing avatars / course-thumbnails
--    / lesson-videos buckets. Public read (attachments are only reachable
--    by students already enrolled, same as your other course assets),
--    authenticated write.
insert into storage.buckets (id, name, public)
values ('lesson-attachments', 'lesson-attachments', true)
on conflict (id) do nothing;

create policy "anyone can view lesson attachments"
  on storage.objects for select
  to public
  using (bucket_id = 'lesson-attachments');

create policy "authenticated users can upload lesson attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lesson-attachments');

create policy "authenticated users can delete their lesson attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lesson-attachments');
