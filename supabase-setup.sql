-- Run this once in your Supabase project (SQL Editor) before deploying.
-- Everything else — profiles, courses, lessons, enrollments,
-- lesson_completions, email_notifications, the avatars/course-thumbnails/
-- lesson-videos storage buckets — already exists from the live app and is
-- reused as-is. These two tables are the only new pieces, backing the
-- rebuilt contact form and newsletter signup.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  role text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;

-- Anyone (including signed-out visitors) can submit the contact form / subscribe.
-- Drop-then-create so this script is safe to re-run (e.g. if you're only
-- here to pick up the `bio` column fix further down and already ran this
-- part before).
drop policy if exists "anyone can submit contact message" on public.contact_messages;
create policy "anyone can submit contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (true);

drop policy if exists "anyone can subscribe to newsletter" on public.newsletter_subscribers;
create policy "anyone can subscribe to newsletter"
  on public.newsletter_subscribers for insert
  to anon, authenticated
  with check (true);

-- Only your own backend/service role should read these — no public select
-- policy is created on purpose. Read them from the Supabase dashboard's
-- Table Editor, or add an admin-only policy if you build an admin view.

-- Belt-and-braces: make sure courses.enrolled_students / rating / type
-- have safe defaults, matching what the teacher course-creation form now
-- sends explicitly. If your live `courses` table already has defaults for
-- these (likely, since the old app relied on them), this is a no-op.
alter table public.courses alter column enrolled_students set default 0;
alter table public.courses alter column rating set default 0;
alter table public.courses alter column type set default 'islamic';

-- "About the teacher" bio not showing on the course page: this app's
-- Teacher Profile Editor writes to a `bio` column on `profiles`, and the
-- course page reads it back. If your live `profiles` table predates this
-- feature, that column may not exist yet — the teacher's name still shows
-- (it's an old column) but bio silently has nothing to read. This adds it
-- without touching any existing data if it's already there.
alter table public.profiles add column if not exists bio text;

-- Make sure PostgREST picks up the schema changes above immediately,
-- instead of serving stale table structure until its cache expires on its
-- own (which can make courses/profiles queries fail right after running
-- this script).
notify pgrst, 'reload schema';
