// Client-only reading-format preference for the Quran reader, shared by the
// surah view and the juz view. Same "device convenience, not account data"
// reasoning as bookmark.ts, so it works the same signed-in or signed-out.
const STORAGE_KEY = "darasaone.quran.viewMode";

export type QuranViewMode = "ayah" | "mushaf";

export function getQuranViewMode(): QuranViewMode {
  if (typeof window === "undefined") return "ayah";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === "mushaf" ? "mushaf" : "ayah";
  } catch {
    return "ayah";
  }
}

export function setQuranViewMode(mode: QuranViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Private-browsing mode or storage full — falls back to the default next load.
  }
}
