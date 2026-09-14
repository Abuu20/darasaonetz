// Client-only "continue reading" bookmark for the Quran reader. Deliberately
// not synced to Supabase — it's a convenience for the current device, not
// account data, so it works the same for signed-in and signed-out visitors.
const STORAGE_KEY = "darasaone.quran.bookmark";

export interface QuranBookmark {
  surahNumber: number;
  surahName: string;
  updatedAt: number;
}

export function getQuranBookmark(): QuranBookmark | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuranBookmark;
  } catch {
    return null;
  }
}

export function setQuranBookmark(surahNumber: number, surahName: string): void {
  if (typeof window === "undefined") return;
  try {
    const bookmark: QuranBookmark = { surahNumber, surahName, updatedAt: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmark));
  } catch {
    // Private-browsing mode or storage full — bookmarking is a nicety, not critical.
  }
}
