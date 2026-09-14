// Client-only reading preferences for which mushaf script and which
// reciter's audio to use, shared by the surah view and the juz view. Same
// "device convenience, not account data" reasoning as viewMode.ts and
// bookmark.ts, so it works the same signed-in or signed-out, and a choice
// made on one surah carries over to the next.
import { DEFAULT_RECITER, DEFAULT_SCRIPT_EDITION } from "./quranApi";

const SCRIPT_KEY = "darasaone.quran.scriptEdition";
const RECITER_KEY = "darasaone.quran.reciter";
const SIDEBAR_KEY = "darasaone.quran.sidebarCollapsed";

export function getQuranScriptEdition(): string {
  if (typeof window === "undefined") return DEFAULT_SCRIPT_EDITION;
  try {
    return window.localStorage.getItem(SCRIPT_KEY) || DEFAULT_SCRIPT_EDITION;
  } catch {
    return DEFAULT_SCRIPT_EDITION;
  }
}

export function setQuranScriptEdition(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCRIPT_KEY, id);
  } catch {
    // Private-browsing mode or storage full — falls back to the default next load.
  }
}

export function getQuranReciter(): string {
  if (typeof window === "undefined") return DEFAULT_RECITER;
  try {
    return window.localStorage.getItem(RECITER_KEY) || DEFAULT_RECITER;
  } catch {
    return DEFAULT_RECITER;
  }
}

export function setQuranReciter(id: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RECITER_KEY, id);
  } catch {
    // Private-browsing mode or storage full — falls back to the default next load.
  }
}

// Whether the always-visible surah column (desktop, lg+) is tucked away so
// the mushaf gets the full reading width. Defaults to collapsed: most
// visits are for reading, not browsing, and the column is one tap away
// from the toggle button whenever a search or surah jump is actually
// needed. Persisted per device, same reasoning as the prefs above.
export function getQuranSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = window.localStorage.getItem(SIDEBAR_KEY);
    return raw === null ? true : raw === "1";
  } catch {
    return true;
  }
}

export function setQuranSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SIDEBAR_KEY, collapsed ? "1" : "0");
  } catch {
    // Private-browsing mode or storage full — falls back to the default next load.
  }
}
