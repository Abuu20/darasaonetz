-- ============================================================================
-- Leaderboard v2 — run once in the Supabase SQL Editor.
-- ============================================================================
-- Adds what the current schema is missing for the redesigned leaderboard:
--   1. point_events   — append-only ledger, so "points this week/month" can
--                        actually be computed. `profiles.total_points` is a
--                        running total with no history, so it can only ever
--                        answer "all time".
--   2. badges / user_badges — Badges didn't exist at all before this.
--   3. get_leaderboard_window() / get_class_leaderboard() — the two reads
--      the UI needs (global board, and a teacher's own roster).
--
-- IMPORTANT CAVEAT: point_events starts empty. It cannot be backfilled from
-- game_scores, because game_scores stores a running total per (game, user)
-- with updated_at overwritten on every play — there's no way to recover
-- "how many points were earned last Tuesday" from that. So Weekly/Monthly
-- will show 0 for everyone until people earn new points *after* this
-- migration runs. All-time is unaffected — it still reads profiles.total_points.
--
-- This does NOT touch or replace your existing game_scores → total_points
-- trigger. It adds a second, independent trigger that also writes a ledger
-- row, so nothing about current scoring behavior changes.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. point_events — append-only ledger
-- ----------------------------------------------------------------------------
create table if not exists public.point_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  points int not null,
  source text not null default 'game', -- 'game' | 'quiz' | 'lesson' | 'bonus' | ...
  source_id uuid,
  created_at timestamptz not null default now()
);

create index if not exists point_events_user_created_idx
  on public.point_events (user_id, created_at desc);

alter table public.point_events enable row level security;

drop policy if exists "users read own point events" on public.point_events;
create policy "users read own point events"
  on public.point_events for select
  to authenticated
  using (user_id = auth.uid());

-- All writes go through the trigger below or the log_points() RPC — no
-- direct insert policy for regular users.

-- Generic RPC so other sources (quiz completion, lesson completion, manual
-- bonuses) can start feeding the ledger later without a schema change.
-- Currently nothing calls this except the game_scores trigger below; wire
-- it up wherever else you want points to count toward weekly/monthly.
create or replace function public.log_points(
  p_user_id uuid,
  p_points int,
  p_source text default 'bonus',
  p_source_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_points = 0 then
    return;
  end if;
  insert into public.point_events (user_id, points, source, source_id)
  values (p_user_id, p_points, p_source, p_source_id);
end;
$$;

grant execute on function public.log_points(uuid, int, text, uuid) to authenticated;

-- Mirrors game_scores into the ledger as *deltas* (not the cumulative
-- value stored on the row), so weekly/monthly sums are correct. Runs
-- alongside whatever trigger you already have updating total_points.
create or replace function public.trg_game_scores_to_ledger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delta int;
begin
  if tg_op = 'INSERT' then
    v_delta := new.points;
  else
    v_delta := new.points - coalesce(old.points, 0);
  end if;

  if v_delta <> 0 then
    insert into public.point_events (user_id, points, source, source_id)
    values (new.user_id, v_delta, 'game', new.game_id);
  end if;

  return new;
end;
$$;

drop trigger if exists game_scores_to_ledger on public.game_scores;
create trigger game_scores_to_ledger
  after insert or update on public.game_scores
  for each row execute function public.trg_game_scores_to_ledger();

-- ----------------------------------------------------------------------------
-- 2. badges / user_badges
-- ----------------------------------------------------------------------------
create table if not exists public.badges (
  id text primary key, -- short code, e.g. 'streak_7'
  name text not null,
  description text not null,
  icon text not null default '🏅', -- emoji or lucide icon name, UI's choice
  criteria_type text not null, -- 'points' | 'streak' | 'courses'
  criteria_value int not null,
  sort_order int not null default 0
);

alter table public.badges enable row level security;
drop policy if exists "anyone can read badge definitions" on public.badges;
create policy "anyone can read badge definitions"
  on public.badges for select
  to authenticated
  using (true);

insert into public.badges (id, name, description, icon, criteria_type, criteria_value, sort_order) values
  ('points_100',   'First Steps',   'Earn 100 points',               '🌱', 'points',  100,  1),
  ('points_1000',  'Rising Star',   'Earn 1,000 points',             '⭐', 'points',  1000, 2),
  ('points_5000',  'Top Scorer',    'Earn 5,000 points',             '🏆', 'points',  5000, 3),
  ('streak_3',     'Warming Up',    'Log a 3-day streak',            '🔥', 'streak',  3,    4),
  ('streak_7',     'Week Strong',   'Log a 7-day streak',            '🔥', 'streak',  7,    5),
  ('streak_30',    'Unstoppable',   'Log a 30-day streak',           '🔥', 'streak',  30,   6),
  ('courses_1',    'Enrolled',      'Join your first course',        '📘', 'courses', 1,    7),
  ('courses_5',    'Dedicated Learner', 'Enroll in 5 courses',       '📚', 'courses', 5,    8)
on conflict (id) do nothing;

create table if not exists public.user_badges (
  user_id uuid not null references public.profiles(id) on delete cascade,
  badge_id text not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;
drop policy if exists "anyone can read earned badges" on public.user_badges;
create policy "anyone can read earned badges"
  on public.user_badges for select
  to authenticated
  using (true); -- needed so a leaderboard/table can show badge counts for other users

-- Evaluates all criteria for one user and inserts any newly-earned badges.
-- Safe to call often (e.g. after every points/streak/enrollment change) —
-- it's a no-op for badges already earned.
create or replace function public.check_and_award_badges(p_user_id uuid)
returns setof public.badges
language plpgsql
security definer
set search_path = public
as $$
declare
  v_points int;
  v_longest_streak int;
  v_course_count int;
begin
  select coalesce(total_points, 0) into v_points from public.profiles where id = p_user_id;

  select coalesce((data->>'longest')::int, 0) into v_longest_streak
  from public.tool_progress
  where user_id = p_user_id and tool = 'streak';

  select count(*) into v_course_count from public.enrollments where student_id = p_user_id;

  return query
  insert into public.user_badges (user_id, badge_id)
  select p_user_id, b.id
  from public.badges b
  where
    (b.criteria_type = 'points'  and v_points          >= b.criteria_value) or
    (b.criteria_type = 'streak'  and v_longest_streak   >= b.criteria_value) or
    (b.criteria_type = 'courses' and v_course_count     >= b.criteria_value)
  on conflict (user_id, badge_id) do nothing
  returning (select b2.* from public.badges b2 where b2.id = badge_id);
end;
$$;

grant execute on function public.check_and_award_badges(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- 3. Leaderboard reads
-- ----------------------------------------------------------------------------

-- Global leaderboard, windowed. p_window: 'weekly' | 'monthly' | 'alltime'.
-- Only includes users with all-time points > 0 (same rule the old
-- getTopPlayers used), so idle accounts don't clutter the board.
create or replace function public.get_leaderboard_window(
  p_window text default 'alltime',
  p_limit int default 100
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  points_all_time int,
  points_in_window int,
  course_count int,
  badge_count int
)
language sql
security definer
set search_path = public
as $$
  with window_points as (
    select pe.user_id, coalesce(sum(pe.points), 0)::int as pts
    from public.point_events pe
    where p_window = 'alltime'
      or (p_window = 'weekly'  and pe.created_at >= now() - interval '7 days')
      or (p_window = 'monthly' and pe.created_at >= now() - interval '30 days')
    group by pe.user_id
  )
  select
    pr.id,
    pr.full_name,
    pr.avatar_url,
    coalesce(pr.total_points, 0),
    case when p_window = 'alltime' then coalesce(pr.total_points, 0)
         else coalesce(wp.pts, 0) end,
    (select count(*) from public.enrollments e where e.student_id = pr.id)::int,
    (select count(*) from public.user_badges ub where ub.user_id = pr.id)::int
  from public.profiles pr
  left join window_points wp on wp.user_id = pr.id
  where coalesce(pr.total_points, 0) > 0
  order by
    case when p_window = 'alltime' then coalesce(pr.total_points, 0) else coalesce(wp.pts, 0) end desc
  limit p_limit;
$$;

grant execute on function public.get_leaderboard_window(text, int) to authenticated;

-- A teacher's own roster — every student enrolled in any of their
-- courses, deduplicated. Unlike the global board, this INCLUDES 0-point
-- students, since "who's in my class" matters more than "who's winning".
create or replace function public.get_class_leaderboard(
  p_teacher_id uuid,
  p_window text default 'alltime'
)
returns table (
  user_id uuid,
  full_name text,
  avatar_url text,
  points_all_time int,
  points_in_window int,
  course_count int,
  badge_count int
)
language sql
security definer
set search_path = public
as $$
  with roster as (
    select distinct e.student_id as id
    from public.enrollments e
    join public.courses c on c.id = e.course_id
    where c.teacher_id = p_teacher_id
  ),
  window_points as (
    select pe.user_id, coalesce(sum(pe.points), 0)::int as pts
    from public.point_events pe
    where p_window = 'alltime'
      or (p_window = 'weekly'  and pe.created_at >= now() - interval '7 days')
      or (p_window = 'monthly' and pe.created_at >= now() - interval '30 days')
    group by pe.user_id
  )
  select
    pr.id,
    pr.full_name,
    pr.avatar_url,
    coalesce(pr.total_points, 0),
    case when p_window = 'alltime' then coalesce(pr.total_points, 0)
         else coalesce(wp.pts, 0) end,
    (select count(*) from public.enrollments e2 where e2.student_id = pr.id and e2.course_id in (
      select c2.id from public.courses c2 where c2.teacher_id = p_teacher_id
    ))::int,
    (select count(*) from public.user_badges ub where ub.user_id = pr.id)::int
  from roster r
  join public.profiles pr on pr.id = r.id
  left join window_points wp on wp.user_id = pr.id
  order by
    case when p_window = 'alltime' then coalesce(pr.total_points, 0) else coalesce(wp.pts, 0) end desc;
$$;

grant execute on function public.get_class_leaderboard(uuid, text) to authenticated;
