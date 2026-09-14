-- Run this once in your Supabase project (SQL Editor).
-- Backs cross-device progress saving for the Islamic tools: Quran reading
-- position, Tasbih counts, saved prayer-times location, etc. One row per
-- (user, tool); `data` is a free-form jsonb blob so each tool can store
-- whatever shape it needs without a schema change per feature.

create table if not exists public.tool_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  tool text not null,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, tool)
);

alter table public.tool_progress enable row level security;

-- A user can only ever see or touch their own progress rows.
drop policy if exists "users manage their own tool progress" on public.tool_progress;
create policy "users manage their own tool progress"
  on public.tool_progress for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
