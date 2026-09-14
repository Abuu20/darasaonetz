// QCF4 (Quran Complex Font v4) data + font loading — the same glyph-based
// rendering technique quran.com uses to get pixel-perfect Madinah Mushaf
// pages: every "letter" on a page is really a pre-shaped ligature glyph in a
// page-specific font, positioned exactly as it sits in the printed 1441 AH
// Madinah Mushaf. Plain Unicode Arabic text (what MushafView used before)
// can never reproduce that — the browser reflows it instead of matching the
// print layout.
//
// Data source: https://github.com/MohamadHajjRabee/quran-qcf4 — a static,
// keyless snapshot (604 page JSON files + 47 font files), unlike the
// official Quran Foundation API which needs a registered OAuth client.
// Chosen for the same "no secret a static site can hold safely" reason
// quranApi.ts picked Al Quran Cloud over quran.foundation's v4 API.
//
// NOTE: this fetches page data from raw.githubusercontent.com and fonts
// from jsDelivr's GitHub CDN at runtime. That's fine to ship, but since the
// app already moved its site images off an external host onto its own
// R2 bucket, the same is worth doing here eventually: copy pages/*.json
// and fonts-woff2/*.woff2 into R2 (or /public) so the reader doesn't depend
// on a third party's uptime.

const QCF4_DATA_BASE = "https://raw.githubusercontent.com/MohamadHajjRabee/quran-qcf4/main";
const QCF4_FONT_CDN_BASE = "https://cdn.jsdelivr.net/gh/MohamadHajjRabee/quran-qcf4@main/fonts-woff2";

export type Qcf4WordType = "word" | "end" | "surah_header" | "bismillah" | "quarter";

export interface Qcf4Word {
  code: number;
  char: string; // Unicode PUA codepoint that maps to the correct glyph in `font`
  font: string; // e.g. "QCF4_Hafs_07" or "QCF4_QBSML" — always the font this exact word needs
  text: string; // plain Arabic text, used as the fallback while `font` is still loading
  type: Qcf4WordType;
  verse_key?: string; // "surah:ayah", present on "word" and "end" types
  position?: number;
  sura?: number; // present on "surah_header" and "bismillah" types
}

export interface Qcf4Line {
  line: number;
  words: Qcf4Word[];
}

export interface Qcf4PageSurahRef {
  id: number;
  name: string;
  name_arabic: string;
  verse_start: number;
  verse_end: number;
}

export interface Qcf4Page {
  page: number;
  font: string;
  surahs: Qcf4PageSurahRef[];
  lines: Qcf4Line[];
}

export interface Qcf4ChapterMeta {
  id: number;
  name: string;
  name_arabic: string;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  verses_count: number;
  pages: [number, number]; // inclusive first/last mushaf page for this surah
  translated_name: string;
}

export interface Qcf4Index {
  meta: {
    schema_version: string;
    total_pages: number;
    total_chapters: number;
    total_verses: number;
    font_count: number;
  };
  chapters: Qcf4ChapterMeta[];
}

// In-memory cache: this is a static snapshot (unlike the live alquran.cloud
// API), so a page or the chapter index never changes underneath a running
// session — no reason to refetch it on every surah/page navigation.
const pageCache = new Map<number, Qcf4Page>();
let indexPromise: Promise<Qcf4Index> | null = null;

const REQUEST_TIMEOUT_MS = 15_000;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`QCF4 data request failed (${res.status}): ${url}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function pageNumberToPath(pageNumber: number): string {
  return String(pageNumber).padStart(3, "0");
}

export function getQcf4Index(): Promise<Qcf4Index> {
  if (!indexPromise) {
    indexPromise = fetchJson<Qcf4Index>(`${QCF4_DATA_BASE}/index.json`).catch(error => {
      indexPromise = null; // allow retrying on the next call instead of caching a rejection forever
      throw error;
    });
  }
  return indexPromise;
}

export async function getSurahPageRange(surahNumber: number): Promise<[number, number]> {
  const index = await getQcf4Index();
  const chapter = index.chapters.find(item => item.id === surahNumber);
  if (!chapter) throw new Error(`Unknown surah number: ${surahNumber}`);
  return chapter.pages;
}

// This QCF4 snapshot places each ayah's "end" marker glyph (the small
// circled-number roundel) BEFORE that ayah's own words within its line,
// instead of after them — where it visually belongs, and where the
// printed Madinah Mushaf actually draws it. Every consumer builds on
// `page.lines` (MushafView renders it directly; getQcf4AyahsForSurah
// groups it by ayah), so the fix lives here, once, at the shared source,
// rather than being patched separately in each place that reads it.
//
// Within a line, words belonging to the same ayah are always contiguous
// (a verse's words never appear in two separate spots on one line) —
// only the "end" marker's position within its own group is wrong — so
// grouping by verse_key and moving any "end" entry to the back of its
// group is a safe, exact fix rather than a blanket reversal (which would
// have also flipped the ayah's real words, which are already correct).
function normalizeLineWordOrder(words: Qcf4Word[]): Qcf4Word[] {
  const groups: Qcf4Word[][] = [];
  const groupIndexByVerse = new Map<string, number>();

  for (const word of words) {
    const groupable = (word.type === "word" || word.type === "end") && word.verse_key != null;
    if (!groupable) {
      groups.push([word]);
      continue;
    }
    let index = groupIndexByVerse.get(word.verse_key!);
    if (index == null) {
      index = groups.length;
      groupIndexByVerse.set(word.verse_key!, index);
      groups.push([]);
    }
    groups[index].push(word);
  }

  return groups.flatMap(group => {
    if (group.length < 2 || !group.some(word => word.type === "end")) return group;
    return [...group.filter(word => word.type !== "end"), ...group.filter(word => word.type === "end")];
  });
}

export async function getQcf4Page(pageNumber: number): Promise<Qcf4Page> {
  const cached = pageCache.get(pageNumber);
  if (cached) return cached;
  const raw = await fetchJson<Qcf4Page>(`${QCF4_DATA_BASE}/pages/${pageNumberToPath(pageNumber)}.json`);
  const page: Qcf4Page = {
    ...raw,
    lines: raw.lines.map(line => ({ ...line, words: normalizeLineWordOrder(line.words) })),
  };
  pageCache.set(pageNumber, page);
  return page;
}

// Fetches every mushaf page a surah spans, in order, in parallel.
export async function getQcf4PagesForSurah(surahNumber: number): Promise<Qcf4Page[]> {
  const [firstPage, lastPage] = await getSurahPageRange(surahNumber);
  const pageNumbers = Array.from({ length: lastPage - firstPage + 1 }, (_, i) => firstPage + i);
  return Promise.all(pageNumbers.map(getQcf4Page));
}

// Every QCF4 font name maps to one file, EXCEPT the shared surah-header
// banner font, which has no per-page "_W" suffix (see repo README's file
// tree: QCF4_Hafs_NN_W.woff2 for reading fonts vs. bare QCF4_QBSML.woff2).
function fontFileName(fontName: string): string {
  return fontName === "QCF4_QBSML" ? `${fontName}.woff2` : `${fontName}_W.woff2`;
}

const loadedFonts = new Set<string>();
const loadingFonts = new Map<string, Promise<void>>();

// Loads one QCF4 font via the FontFace API and registers it on
// document.fonts. Safe to call repeatedly with the same name — in-flight
// and completed loads are cached, so re-rendering the same page (or
// navigating back to it) never re-downloads a font.
export function loadQcf4Font(fontName: string): Promise<void> {
  if (typeof document === "undefined") return Promise.resolve();
  if (loadedFonts.has(fontName)) return Promise.resolve();

  const inFlight = loadingFonts.get(fontName);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const fontFace = new FontFace(fontName, `url('${QCF4_FONT_CDN_BASE}/${fontFileName(fontName)}')`);
    fontFace.display = "swap";
    await fontFace.load();
    document.fonts.add(fontFace);
    loadedFonts.add(fontName);
  })().finally(() => {
    loadingFonts.delete(fontName);
  });

  loadingFonts.set(fontName, promise);
  return promise;
}

export function isQcf4FontLoaded(fontName: string): boolean {
  return loadedFonts.has(fontName);
}

// Every distinct font a page's words actually need — almost always just
// the page's own reading font, plus "QCF4_QBSML" on pages that carry a
// surah-header banner.
export function collectPageFonts(page: Qcf4Page): string[] {
  const fonts = new Set<string>();
  for (const line of page.lines) {
    for (const word of line.words) {
      fonts.add(word.font);
    }
  }
  return Array.from(fonts);
}

export function ayahNumberFromVerseKey(verseKey: string): number {
  const parts = verseKey.split(":");
  return Number(parts[1]) || 0;
}

function surahNumberFromVerseKey(verseKey: string): number {
  return Number(verseKey.split(":")[0]) || 0;
}

// Trims a mushaf page down to exactly one surah's content. The first and
// last page a surah spans are almost always shared with the surah before
// or after it (a printed page doesn't break at surah boundaries), so
// without this, opening a surah — including via "next"/"previous" — would
// still show a few leftover lines belonging to the neighboring surah.
// "quarter" (rub-el-hizb) markers have no surah of their own and are
// dropped here too, for the same "show exactly this surah" reason.
export function filterPageToSurah(page: Qcf4Page, surahNumber: number): Qcf4Page {
  const lines = page.lines
    .map(line => ({
      line: line.line,
      words: line.words.filter(word => {
        if (word.type === "word" || word.type === "end") {
          return word.verse_key != null && surahNumberFromVerseKey(word.verse_key) === surahNumber;
        }
        if (word.type === "surah_header" || word.type === "bismillah") {
          return word.sura === surahNumber;
        }
        return false;
      }),
    }))
    .filter(line => line.words.length > 0);
  return { ...page, lines };
}

// Fetches a surah's mushaf pages already trimmed to exactly that surah —
// what both MushafView (page view) and getQcf4AyahsForSurah (ayah view)
// build on, so "next surah" / "previous surah" never leaks a neighboring
// surah's leftover lines from a shared boundary page.
export async function getExactQcf4PagesForSurah(surahNumber: number): Promise<Qcf4Page[]> {
  const pages = await getQcf4PagesForSurah(surahNumber);
  return pages.map(page => filterPageToSurah(page, surahNumber)).filter(page => page.lines.length > 0);
}

export interface Qcf4Ayah {
  numberInSurah: number;
  words: Qcf4Word[];
}

// Groups a surah's own glyph words into one entry per ayah, in ayah order
// — what the ayah-by-ayah reading view renders instead of the plain
// Unicode text it used before, so both view modes show the same
// pixel-accurate Madinah Mushaf glyphs. Built from the already
// surah-exact pages, so an ayah list never picks up a neighboring surah's
// words either.
export async function getQcf4AyahsForSurah(surahNumber: number): Promise<Qcf4Ayah[]> {
  const pages = await getExactQcf4PagesForSurah(surahNumber);
  const byAyah = new Map<number, Qcf4Word[]>();

  for (const page of pages) {
    for (const line of page.lines) {
      for (const word of line.words) {
        if (word.type !== "word" && word.type !== "end") continue;
        if (!word.verse_key) continue;
        const ayahNumber = ayahNumberFromVerseKey(word.verse_key);
        const bucket = byAyah.get(ayahNumber) ?? [];
        bucket.push(word);
        byAyah.set(ayahNumber, bucket);
      }
    }
  }

  return Array.from(byAyah.entries())
    .sort(([a], [b]) => a - b)
    .map(([numberInSurah, words]) => ({ numberInSurah, words }));
}
