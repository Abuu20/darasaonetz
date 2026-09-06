import type { EditionMeta, JuzEdition, SearchResult, SurahEdition, SurahMeta } from "./types";

// The mushaf is conventionally divided into 30 equal-length juz (para).
export const JUZ_COUNT = 30;

// Al Quran Cloud (https://alquran.cloud/api) — the same open Quran-data
// ecosystem quran.com itself is built on. Chosen over quran.com's own v4 API
// because that one now requires a registered app + OAuth client credentials
// (see api-docs.quran.foundation) — secrets a static site can't hold safely
// in the browser. This API is fully public, keyless, and CORS-enabled, so it
// works straight from the client with nothing to configure or leak.
const BASE_URL = "https://api.alquran.cloud/v1";

// Long-standing, stable identifiers on this API — safe to depend on directly.
export const ARABIC_EDITION = "quran-uthmani";
export const DEFAULT_AUDIO_EDITION = "ar.alafasy"; // Mishary Alafasy, verse-by-verse

// Script (mushaf) styles the reader can choose between. "quran-uthmani" is
// the Madani-style Uthmani script used across print mushafs; "quran-simple"
// drops the more elaborate Uthmani orthography for plain, modern Arabic
// spelling — the same "simple" script Tanzil/quran.com offer as an easier
// alternative for readers less used to the Uthmani rasm. Both are
// long-standing identifiers on this API.
export interface ScriptOption {
  id: string;
  labelKey: "scriptUthmani" | "scriptSimple";
}
export const SCRIPT_EDITIONS: ScriptOption[] = [
  { id: "quran-uthmani", labelKey: "scriptUthmani" },
  { id: "quran-simple", labelKey: "scriptSimple" },
];
export const DEFAULT_SCRIPT_EDITION = SCRIPT_EDITIONS[0].id;

// A curated set of verse-by-verse reciters this API serves audio for
// (matching the reciters AlQuran Cloud itself credits — see
// alquran.cloud/contributors). Reciter names are proper nouns and are shown
// as-is in every language, the same way surah.englishName isn't translated.
export interface ReciterOption {
  id: string;
  name: string;
}
export const RECITERS: ReciterOption[] = [
  { id: "ar.alafasy", name: "Mishary Alafasy" },
  { id: "ar.abdulbasitmurattal", name: "Abdul Basit Abdul Samad" },
  { id: "ar.husary", name: "Mahmoud Al-Husary" },
  { id: "ar.minshawi", name: "Mohamed Al-Minshawi" },
  { id: "ar.mahermuaiqly", name: "Maher Al-Muaiqly" },
  { id: "ar.hudhaify", name: "Ali Al-Hudhaify" },
];
export const DEFAULT_RECITER = RECITERS[0].id;

// Used only until getDefaultTranslationEdition() below resolves a real
// identifier from the live edition list for the site's active language —
// never assumed to be the only valid one, so a renamed/retired edition on
// the API side degrades to "pick whatever's first" instead of breaking.
const FALLBACK_TRANSLATIONS: Record<string, string> = {
  en: "en.sahih", // Sahih International
  sw: "sw.barwani", // Sheikh Ali Muhsin Al-Barwani
};

// In-memory cache: juz/surah text never changes, so once a page has been
// fetched successfully in this session there's no reason to hit the
// network for it again — every juz page has a "previous/next" pager right
// next to it, and without this, clicking back and forth re-downloads the
// same ~multi-edition payload every time, which is exactly the kind of
// repeated load that turns a flaky connection into a wall of "couldn't
// load this juz" errors.
const responseCache = new Map<string, unknown>();

// The juz endpoint in particular returns three full editions (Arabic +
// translation + audio links) for every ayah in the juz in one response, so
// it's a meaningfully large request. A single fetch() with no timeout can
// hang indefinitely on a slow/flaky mobile connection with nothing for the
// user to do but wait on a spinner, and a single dropped packet was enough
// to fail the whole juz. Give every request a timeout and a couple of
// retries with backoff before surfacing an error.
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_ATTEMPTS = 3;

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getJson<T>(path: string): Promise<T> {
  const cached = responseCache.get(path);
  if (cached) return cached as T;

  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetchWithTimeout(`${BASE_URL}${path}`, REQUEST_TIMEOUT_MS);
      if (!res.ok) throw new Error(`Quran API request failed (${res.status})`);
      const json = await res.json();
      if (json.code !== 200) throw new Error(json.status || "Quran API error");
      responseCache.set(path, json.data);
      return json.data as T;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_ATTEMPTS) {
        // 500ms, then 1500ms — brief enough not to feel stuck, long enough
        // to ride out a momentary hiccup instead of hammering the API.
        await delay(attempt * 1000 - 500);
      }
    }
  }
  throw lastError;
}

export const quranApi = {
  getSurahList: (): Promise<SurahMeta[]> => getJson<SurahMeta[]>("/surah"),

  getSurahMeta: (number: number): Promise<SurahMeta> => getJson<SurahMeta>(`/surah/${number}`),

  // Arabic (Uthmani script) + one translation + verse-by-verse audio.
  //
  // The API's "multiple editions in one request" path
  // (/surah/{n}/editions/{a},{b},{c}) is NOT part of the current, live
  // API — it 404s unconditionally, every time, regardless of network
  // quality (confirmed against the official docs at alquran.cloud/api,
  // which only document the single-edition form below). Fetch each
  // edition with its own request instead, run in parallel so it's no
  // slower than the old single-request approach.
  getSurahReading: async (
    number: number,
    translationEdition: string,
    scriptEdition: string = DEFAULT_SCRIPT_EDITION,
    reciterEdition: string = DEFAULT_AUDIO_EDITION
  ): Promise<{ arabic: SurahEdition; translation: SurahEdition; audio: SurahEdition }> => {
    const [arabic, translation, audio] = await Promise.all([
      getJson<SurahEdition>(`/surah/${number}/${scriptEdition}`),
      getJson<SurahEdition>(`/surah/${number}/${translationEdition}`),
      getJson<SurahEdition>(`/surah/${number}/${reciterEdition}`),
    ]);
    return { arabic, translation, audio };
  },

  // Same idea as getSurahReading, but for a whole juz (para) — spans
  // multiple surahs, so each returned ayah carries its own surah in
  // ayah.surah rather than one surah applying to the whole response.
  // Same fix as above: one request per edition instead of the
  // non-existent combined /juz/{n}/editions/{a},{b},{c} path.
  getJuzReading: async (
    number: number,
    translationEdition: string,
    scriptEdition: string = DEFAULT_SCRIPT_EDITION,
    reciterEdition: string = DEFAULT_AUDIO_EDITION
  ): Promise<{ arabic: JuzEdition; translation: JuzEdition; audio: JuzEdition }> => {
    const [arabic, translation, audio] = await Promise.all([
      getJson<JuzEdition>(`/juz/${number}/${scriptEdition}`),
      getJson<JuzEdition>(`/juz/${number}/${translationEdition}`),
      getJson<JuzEdition>(`/juz/${number}/${reciterEdition}`),
    ]);
    return { arabic, translation, audio };
  },

  getTranslationEditions: (language: string): Promise<EditionMeta[]> =>
    getJson<EditionMeta[]>(`/edition?format=text&type=translation&language=${encodeURIComponent(language)}`),

  // Prefers the well-known default for the language if the API still lists
  // it; otherwise falls back to whatever translation edition it does list,
  // so the reader keeps working even if an identifier ever changes upstream.
  getDefaultTranslationEdition: async (language: string): Promise<string> => {
    const fallback = FALLBACK_TRANSLATIONS[language] ?? FALLBACK_TRANSLATIONS.en;
    try {
      const editions = await quranApi.getTranslationEditions(language);
      if (editions.some(edition => edition.identifier === fallback)) return fallback;
      if (editions.length > 0) return editions[0].identifier;
    } catch {
      // Network hiccup or API change — the hardcoded fallback below still works.
    }
    return fallback;
  },

  search: (keyword: string, translationEdition: string): Promise<SearchResult> =>
    getJson<SearchResult>(`/search/${encodeURIComponent(keyword)}/all/${translationEdition}`),
};
