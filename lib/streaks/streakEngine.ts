import { differenceInCalendarDays, format, parseISO, subDays } from "date-fns";

// Kept deliberately small and framework-free so it's easy to unit test and
// safe to reuse from any tool (lessons, quizzes, Quran reader, daily
// hadith/dua) without any of them knowing about Supabase or React state.
export interface StreakData {
  current: number;
  longest: number;
  lastActiveDate: string | null; // yyyy-MM-dd, device-local
  activeDates: string[]; // last HISTORY_DAYS days that had activity, yyyy-MM-dd
}

export const EMPTY_STREAK: StreakData = {
  current: 0,
  longest: 0,
  lastActiveDate: null,
  activeDates: [],
};

// How many days of history we keep for the activity strip. Generous enough
// for a "last 30 days" view without the row growing without bound.
const HISTORY_DAYS = 30;

export function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

// Call this whenever the student does something that should count toward
// today's streak (finishes a lesson, submits a quiz, reads the daily
// hadith/dua, etc). Safe to call many times a day — only the first call
// each day changes anything, so every call site can fire it unconditionally
// without needing to track "have I already logged today" itself.
export function recordActivity(data: StreakData, today: string = todayKey()): StreakData {
  if (data.lastActiveDate === today) return data;

  const gap = data.lastActiveDate ? differenceInCalendarDays(parseISO(today), parseISO(data.lastActiveDate)) : null;
  // Exactly one calendar day since the last logged day continues the streak;
  // anything else (a gap, or the very first activity ever) restarts it at 1.
  const current = gap === 1 ? data.current + 1 : 1;
  const activeDates = [...data.activeDates, today].slice(-HISTORY_DAYS);

  return {
    current,
    longest: Math.max(data.longest, current),
    lastActiveDate: today,
    activeDates,
  };
}

// A streak whose last activity was before yesterday has lapsed — the stored
// `current` is stale until the next `recordActivity` call resets it, so the
// UI should read through this rather than `data.current` directly.
export function isStreakLapsed(data: StreakData, today: string = todayKey()): boolean {
  if (!data.lastActiveDate) return false;
  return differenceInCalendarDays(parseISO(today), parseISO(data.lastActiveDate)) >= 2;
}

// The streak count to actually display — 0 once lapsed, even before the next
// activity event physically resets `current` in storage.
export function effectiveCurrent(data: StreakData, today: string = todayKey()): number {
  return isStreakLapsed(data, today) ? 0 : data.current;
}

export function hasLoggedToday(data: StreakData, today: string = todayKey()): boolean {
  return data.lastActiveDate === today;
}

// Oldest-first list of the last `n` days for a calendar-style activity strip.
export function lastNDays(data: StreakData, n = 7): { date: string; active: boolean }[] {
  const active = new Set(data.activeDates);
  const days: { date: string; active: boolean }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    days.push({ date, active: active.has(date) });
  }
  return days;
}

// Milestones the widget can badge — kept as plain day thresholds so adding
// one later is a one-line change.
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100] as const;
