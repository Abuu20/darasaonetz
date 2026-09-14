// A small, static rotating set of daily reminders — kept short and
// paraphrased rather than quoted from any one translation. This is meant as
// a lightweight "read one thing today" nudge for the streak widget, not a
// hadith/Quran database — pair with the Verse Mapper or a dedicated Hadith
// tool later if the roadmap wants a real searchable library.
export interface DailyEntry {
  id: string;
  kind: "hadith" | "dua";
  en: string;
  sw: string;
  sourceEn: string;
  sourceSw: string;
}

export const DAILY_ENTRIES: DailyEntry[] = [
  {
    id: "intentions",
    kind: "hadith",
    en: "Actions are judged by the intentions behind them — so renew your niyyah before you begin today's tasks.",
    sw: "Matendo hupimwa kwa nia zilizo nyuma yake — hivyo hakikisha nia yako iko sawa kabla ya kuanza majukumu ya leo.",
    sourceEn: "Hadith — on intentions",
    sourceSw: "Hadithi — kuhusu nia",
  },
  {
    id: "smile",
    kind: "hadith",
    en: "A simple smile to another person is counted as an act of charity.",
    sw: "Tabasamu rahisi kwa mtu mwingine huhesabiwa kuwa ni sadaka.",
    sourceEn: "Hadith — on charity",
    sourceSw: "Hadithi — kuhusu sadaka",
  },
  {
    id: "morning-ease",
    kind: "dua",
    en: "A short morning dua: ask Allah for ease in whatever the day brings, and for the strength to be grateful in it.",
    sw: "Dua fupi ya asubuhi: mwombe Allah wepesi katika lolote litakalotokea leo, na nguvu ya kushukuru ndani yake.",
    sourceEn: "Dua — morning remembrance",
    sourceSw: "Dua — dhikr za asubuhi",
  },
  {
    id: "knowledge",
    kind: "hadith",
    en: "Seeking beneficial knowledge is described as an obligation on every believer — today's lesson counts toward that.",
    sw: "Kutafuta elimu yenye manufaa kunaelezwa kuwa ni wajibu kwa kila muumini — somo la leo ni sehemu ya hilo.",
    sourceEn: "Hadith — on seeking knowledge",
    sourceSw: "Hadithi — kuhusu kutafuta elimu",
  },
  {
    id: "patience",
    kind: "hadith",
    en: "Whoever is patient, Allah will grant them patience — none is given a gift better or more all-encompassing than patience.",
    sw: "Anayejitahidi kuwa na subira, Allah humpa subira — hakuna zawadi bora zaidi na yenye upana kama subira.",
    sourceEn: "Hadith — on patience",
    sourceSw: "Hadithi — kuhusu subira",
  },
  {
    id: "evening-gratitude",
    kind: "dua",
    en: "Before you sleep tonight, spend a moment thanking Allah for three specific things from today.",
    sw: "Kabla ya kulala usiku wa leo, chukua muda kumshukuru Allah kwa mambo matatu mahususi ya leo.",
    sourceEn: "Dua — evening reflection",
    sourceSw: "Dua — tafakari ya jioni",
  },
  {
    id: "kind-words",
    kind: "hadith",
    en: "A good word is itself regarded as a form of charity — choose your words with someone today.",
    sw: "Neno jema lenyewe linahesabiwa kuwa ni aina ya sadaka — chagua maneno yako kwa mtu leo.",
    sourceEn: "Hadith — on good speech",
    sourceSw: "Hadithi — kuhusu usemi mzuri",
  },
];

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

// Same entry all day for everyone, rotating deterministically by date rather
// than randomly, so refreshing the page never changes the entry mid-day.
export function todaysEntry(date: Date = new Date()): DailyEntry {
  const index = dayOfYear(date) % DAILY_ENTRIES.length;
  return DAILY_ENTRIES[index];
}
