-- Turns contact_messages into a real, readable inbox for admins.
-- Run this once in the Supabase SQL Editor (safe to re-run).

-- Track when a message has been read, so the inbox can show unread state.
alter table public.contact_messages
  add column if not exists read_at timestamptz;

-- Admins can read every submitted message.
drop policy if exists "admins can read contact messages" on public.contact_messages;
create policy "admins can read contact messages"
  on public.contact_messages for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Admins can mark messages as read.
drop policy if exists "admins can update contact messages" on public.contact_messages;
create policy "admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- One-time: make your own account an admin. Replace the email, then run
-- just this statement. Find your account's email in Supabase ->
-- Authentication -> Users if you're not sure which one is yours.
-- update public.profiles set role = 'admin' where email = 'you@example.com';
