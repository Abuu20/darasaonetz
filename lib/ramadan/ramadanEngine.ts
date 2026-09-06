// Kept framework-free like lib/streaks/streakEngine.ts — one JSON blob per
// user, stored under tool_progress.tool = "ramadan", same table every other
// tool already shares. No new migration needed.

export interface RamadanDayEntry {
  fasted: boolean;
  taraweeh: boolean;
  pagesRead: number;
}

export interface CharityEntry {
  id: string;
  amount: number;
  note: string;
  date: string; // yyyy-MM-dd
}

export interface RamadanState {
  hijriYear: number | null; // which Ramadan (AH year) this planner belongs to
  totalDays: 29 | 30;
  quranTargetPages: number;
  days: Record<number, RamadanDayEntry>; // keyed 1..totalDays
  zakatWealth: number;
  zakatPaid: boolean;
  charity: CharityEntry[];
}

// A standard Madani-mushaf Qur'an is 604 pages — a full khatm (complete
// reading) over ~30 days works out to roughly 20 pages/day, which is the
// default target shown to students before they customise it.
export const QURAN_TOTAL_PAGES = 604;

export const EMPTY_RAMADAN_STATE: RamadanState = {
  hijriYear: null,
  totalDays: 30,
  quranTargetPages: QURAN_TOTAL_PAGES,
  days: {},
  zakatWealth: 0,
  zakatPaid: false,
  charity: [],
};

const EMPTY_DAY: RamadanDayEntry = { fasted: false, taraweeh: false, pagesRead: 0 };

export function getDay(state: RamadanState, day: number): RamadanDayEntry {
  return state.days[day] ?? EMPTY_DAY;
}

export function setDay(state: RamadanState, day: number, patch: Partial<RamadanDayEntry>): RamadanState {
  const current = getDay(state, day);
  return {
    ...state,
    days: { ...state.days, [day]: { ...current, ...patch } },
  };
}

// If the Hijri year moves on to a new Ramadan, the previous year's entries
// are cleared automatically rather than carried over silently — a fresh
// planner each Ramadan, same as the real thing coming around each year.
export function resetForNewYear(state: RamadanState, hijriYear: number): RamadanState {
  if (state.hijriYear === hijriYear) return state;
  return { ...EMPTY_RAMADAN_STATE, hijriYear, quranTargetPages: state.quranTargetPages, totalDays: state.totalDays };
}

export function totalPagesRead(state: RamadanState): number {
  return Object.values(state.days).reduce((sum, d) => sum + (d.pagesRead || 0), 0);
}

export function fastedCount(state: RamadanState): number {
  return Object.values(state.days).filter(d => d.fasted).length;
}

export function taraweehCount(state: RamadanState): number {
  return Object.values(state.days).filter(d => d.taraweeh).length;
}

// 2.5% (1/40) of zakatable wealth — the standard Zakat al-Mal rate.
export function calculateZakat(wealth: number): number {
  return Math.max(0, wealth) * 0.025;
}

export function charityTotal(state: RamadanState): number {
  return state.charity.reduce((sum, c) => sum + (c.amount || 0), 0);
}

export function addCharityEntry(state: RamadanState, entry: Omit<CharityEntry, "id">): RamadanState {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return { ...state, charity: [{ ...entry, id }, ...state.charity] };
}

export function removeCharityEntry(state: RamadanState, id: string): RamadanState {
  return { ...state, charity: state.charity.filter(c => c.id !== id) };
}
