// Shapes returned by the Al Quran Cloud API (https://alquran.cloud/api) — an
// open, unauthenticated Quran data API. Kept separate from lib/db/types.ts
// since this data comes from a public REST API, not Supabase.

export interface SurahMeta {
  number: number; // 1-114
  name: string; // Arabic name, e.g. "سُورَةُ ٱلْفَاتِحَةِ"
  englishName: string; // e.g. "Al-Faatiha"
  englishNameTranslation: string; // e.g. "The Opening"
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan" | string;
}

export interface EditionMeta {
  identifier: string; // e.g. "quran-uthmani", "en.sahih", "sw.barwani", "ar.alafasy"
  language: string; // 2-letter code
  name: string; // native-script name
  englishName: string;
  format: "text" | "audio";
  type: string; // "translation" | "versebyverse" | "quran" | ...
  direction: "rtl" | "ltr" | null;
}

export interface Ayah {
  number: number; // absolute position across the whole mushaf (1-6236)
  numberInSurah: number;
  text: string;
  juz: number;
  page: number;
  audio?: string;
  audioSecondary?: string[];
  // Only present when the ayah comes from the /juz endpoint, which spans
  // multiple surahs and so embeds each ayah's parent surah metadata.
  surah?: SurahMeta;
}

// Response shape for a /juz/{number}/{edition} lookup — a juz has no
// single surah, so (unlike SurahEdition) there is no surah metadata at the
// top level; each ayah carries its own via Ayah.surah instead.
export interface JuzEdition {
  ayahs: Ayah[];
  edition: EditionMeta;
}

export interface SurahEdition extends SurahMeta {
  ayahs: Ayah[];
  edition: EditionMeta;
}

export interface SearchMatch {
  number: number;
  text: string;
  numberInSurah: number;
  surah: SurahMeta;
  edition: EditionMeta;
}

export interface SearchResult {
  count: number;
  matches: SearchMatch[];
}
