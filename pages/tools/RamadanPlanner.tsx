import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, Check, HandCoins, HeartHandshake, Moon, Plus, Trash2, UtensilsCrossed, Users } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { useHijriToday } from "@/lib/quran/useHijriToday";
import { useRamadanPlanner } from "@/lib/hooks/useRamadanPlanner";
import { useStreak } from "@/lib/hooks/useStreak";
import {
  addCharityEntry,
  calculateZakat,
  charityTotal,
  fastedCount,
  getDay,
  removeCharityEntry,
  setDay,
  taraweehCount,
  totalPagesRead,
} from "@/lib/ramadan/ramadanEngine";

export default function RamadanPlanner() {
  const { t, language } = useLanguage();
  const T = (key: string) => t(`pages.tools.RamadanPlanner.${key}`);
  const { hijri, isRamadan, ramadanDayNumber, loading: hijriLoading } = useHijriToday();
  const { state, setState, syncYear } = useRamadanPlanner();
  const { logActivity } = useStreak();

  const [selectedDay, setSelectedDay] = useState(1);
  const [pagesInput, setPagesInput] = useState("0");
  const [wealthInput, setWealthInput] = useState(String(state.zakatWealth || ""));
  const [charityAmount, setCharityAmount] = useState("");
  const [charityNote, setCharityNote] = useState("");

  // Once we know the Hijri year, clear last year's check-ins the first time
  // a new Ramadan is detected, and default the selected day to today.
  useEffect(() => {
    if (!hijri) return;
    syncYear(Number(hijri.year));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hijri?.year]);

  useEffect(() => {
    if (isRamadan && ramadanDayNumber) setSelectedDay(ramadanDayNumber);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRamadan, ramadanDayNumber]);

  useEffect(() => {
    setPagesInput(String(getDay(state, selectedDay).pagesRead || 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay, state.days[selectedDay]?.pagesRead]);

  const isToday = isRamadan && selectedDay === ramadanDayNumber;
  const dayEntry = getDay(state, selectedDay);

  const updateDay = (patch: Parameters<typeof setDay>[2]) => {
    setState(setDay(state, selectedDay, patch));
    if (isToday) logActivity();
  };

  const commitPages = () => {
    const value = Math.max(0, Number(pagesInput) || 0);
    updateDay({ pagesRead: value });
  };

  const pagesTarget = state.quranTargetPages || 1;
  const pagesDone = totalPagesRead(state);
  const quranPct = Math.min(100, Math.round((pagesDone / pagesTarget) * 100));

  const zakatDue = calculateZakat(state.zakatWealth);
  const charitySum = charityTotal(state);

  const submitWealth = (event: FormEvent) => {
    event.preventDefault();
    setState({ ...state, zakatWealth: Math.max(0, Number(wealthInput) || 0) });
  };

  const submitCharity = (event: FormEvent) => {
    event.preventDefault();
    const amount = Number(charityAmount);
    if (!amount || amount <= 0) return;
    const today = new Date().toISOString().slice(0, 10);
    setState(addCharityEntry(state, { amount, note: charityNote.trim(), date: today }));
    setCharityAmount("");
    setCharityNote("");
    logActivity();
  };

  return (
    <>
      <SEOHead titleKey={T("seo.title")} descriptionKey={T("seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.tools.RamadanPlanner.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {T("eyebrow")}
          </span>
          <h1 data-text-id="pages.tools.RamadanPlanner.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {T("title")}
          </h1>
          <p data-text-id="pages.tools.RamadanPlanner.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {T("paragraph")}
          </p>
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto flex max-w-2xl flex-col gap-block">
            {/* Hijri status banner */}
            <div className="flex flex-col items-center gap-1 rounded-card bg-mist px-block py-stack text-center">
              <Moon size={20} className="text-accent" aria-hidden="true" />
              {hijriLoading ? (
                <span className="text-sm text-slate">{T("loadingDate")}</span>
              ) : hijri ? (
                <>
                  <span className="text-sm text-ink">
                    {hijri.day} {hijri.month.en} {hijri.year} {T("hijriSuffix")}
                  </span>
                  <span className="text-xs text-slate">
                    {isRamadan
                      ? `${T("ramadanDayLabel")} ${ramadanDayNumber} / ${state.totalDays}`
                      : T("notRamadanYet")}
                  </span>
                </>
              ) : (
                <span className="text-sm text-slate">{T("dateUnavailable")}</span>
              )}
            </div>

            {/* Day picker strip */}
            <div className="flex flex-col gap-tight">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-widest text-slate">{T("daysLabel")}</span>
                <div className="flex gap-1 text-xs text-slate">
                  {[29, 30].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setState({ ...state, totalDays: n as 29 | 30 })}
                      aria-pressed={state.totalDays === n}
                      className={`rounded-pill border px-tight py-0.5 transition-colors duration-base ${
                        state.totalDays === n ? "border-transparent bg-ink text-ink-foreground" : "border-line hover:border-accent"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-6 gap-1 sm:grid-cols-10">
                {Array.from({ length: state.totalDays }, (_, i) => i + 1).map(day => {
                  const entry = getDay(state, day);
                  const doneCount = Number(entry.fasted) + Number(entry.taraweeh) + Number(entry.pagesRead > 0);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      aria-pressed={selectedDay === day}
                      className={`flex h-9 items-center justify-center rounded-control border text-xs transition-colors duration-base ${
                        selectedDay === day
                          ? "border-accent bg-accent/10 text-accent"
                          : doneCount === 3
                            ? "border-transparent bg-ember text-ember-foreground"
                            : doneCount > 0
                              ? "border-transparent bg-ember/30 text-ink"
                              : "border-line text-slate hover:border-accent"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day editor */}
            <div className="flex flex-col gap-stack rounded-card border border-line p-block">
              <span className="text-sm font-semibold text-ink">
                {T("dayLabel")} {selectedDay}
                {isToday ? ` · ${T("todayTag")}` : ""}
              </span>

              <button
                type="button"
                onClick={() => updateDay({ fasted: !dayEntry.fasted })}
                aria-pressed={dayEntry.fasted}
                className={`flex items-center justify-between rounded-control border px-stack py-tight text-sm transition-colors duration-base ${
                  dayEntry.fasted ? "border-transparent bg-ember/10 text-ink" : "border-line text-slate hover:border-accent"
                }`}
              >
                <span className="flex items-center gap-tight">
                  <UtensilsCrossed size={16} aria-hidden="true" />
                  {T("fastedLabel")}
                </span>
                {dayEntry.fasted ? <Check size={16} className="text-ember" aria-hidden="true" /> : null}
              </button>

              <button
                type="button"
                onClick={() => updateDay({ taraweeh: !dayEntry.taraweeh })}
                aria-pressed={dayEntry.taraweeh}
                className={`flex items-center justify-between rounded-control border px-stack py-tight text-sm transition-colors duration-base ${
                  dayEntry.taraweeh ? "border-transparent bg-accent/10 text-ink" : "border-line text-slate hover:border-accent"
                }`}
              >
                <span className="flex items-center gap-tight">
                  <Users size={16} aria-hidden="true" />
                  {T("taraweehLabel")}
                </span>
                {dayEntry.taraweeh ? <Check size={16} className="text-accent" aria-hidden="true" /> : null}
              </button>

              <label className="flex items-center justify-between gap-stack rounded-control border border-line px-stack py-tight text-sm text-slate">
                <span className="flex items-center gap-tight text-ink">
                  <BookOpen size={16} aria-hidden="true" />
                  {T("pagesReadLabel")}
                </span>
                <input
                  type="number"
                  min={0}
                  value={pagesInput}
                  onChange={event => setPagesInput(event.target.value)}
                  onBlur={commitPages}
                  className="w-20 rounded-control border border-line bg-background px-tight py-1 text-right text-ink outline-none"
                />
              </label>
            </div>

            {/* Qur'an khatm progress */}
            <div className="flex flex-col gap-tight rounded-card border border-line p-block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-ink">{T("quranGoalLabel")}</span>
                <label className="flex items-center gap-1 text-xs text-slate">
                  {T("targetLabel")}
                  <input
                    type="number"
                    min={1}
                    value={state.quranTargetPages}
                    onChange={event => setState({ ...state, quranTargetPages: Math.max(1, Number(event.target.value) || 1) })}
                    className="w-16 rounded-control border border-line bg-background px-tight py-0.5 text-right text-ink outline-none"
                  />
                </label>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-pill bg-mist">
                <div className="gradient-brand h-full rounded-pill transition-all duration-slow" style={{ width: `${quranPct}%` }} />
              </div>
              <span className="text-xs text-slate">
                {pagesDone} / {state.quranTargetPages} {T("pagesUnit")} ({quranPct}%)
              </span>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-tight text-center">
              <div className="flex flex-col gap-1 rounded-card bg-mist px-stack py-stack">
                <span className="font-heading text-2xl text-ink">{fastedCount(state)}</span>
                <span className="text-xs text-slate">{T("statFasted")}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-card bg-mist px-stack py-stack">
                <span className="font-heading text-2xl text-ink">{taraweehCount(state)}</span>
                <span className="text-xs text-slate">{T("statTaraweeh")}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-card bg-mist px-stack py-stack">
                <span className="font-heading text-2xl text-ink">{pagesDone}</span>
                <span className="text-xs text-slate">{T("statPages")}</span>
              </div>
            </div>

            {/* Zakat calculator */}
            <div className="flex flex-col gap-stack rounded-card border border-line p-block">
              <span className="flex items-center gap-tight text-sm font-semibold text-ink">
                <HandCoins size={18} className="text-accent" aria-hidden="true" />
                {T("zakatHeading")}
              </span>
              <p className="text-xs text-slate">{T("zakatExplainer")}</p>
              <form onSubmit={submitWealth} className="flex items-center gap-tight">
                <input
                  type="number"
                  min={0}
                  value={wealthInput}
                  onChange={event => setWealthInput(event.target.value)}
                  placeholder={T("wealthPlaceholder")}
                  className="flex-1 rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none"
                />
                <button type="submit" className="rounded-control border border-line px-stack py-tight text-sm text-ink hover:border-accent">
                  {T("calculateButton")}
                </button>
              </form>
              {state.zakatWealth > 0 ? (
                <div className="flex items-center justify-between rounded-control bg-mist px-stack py-tight text-sm">
                  <span className="text-ink">
                    {T("zakatDueLabel")}: {zakatDue.toLocaleString(language === "sw" ? "sw-TZ" : "en-US", { maximumFractionDigits: 2 })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setState({ ...state, zakatPaid: !state.zakatPaid })}
                    aria-pressed={state.zakatPaid}
                    className={`flex items-center gap-1 rounded-pill px-stack py-1 text-xs transition-colors duration-base ${
                      state.zakatPaid ? "bg-success/15 text-success" : "border border-line text-slate hover:border-accent"
                    }`}
                  >
                    <Check size={12} aria-hidden="true" />
                    {state.zakatPaid ? T("zakatPaid") : T("markPaid")}
                  </button>
                </div>
              ) : null}
            </div>

            {/* Charity log */}
            <div className="flex flex-col gap-stack rounded-card border border-line p-block">
              <span className="flex items-center gap-tight text-sm font-semibold text-ink">
                <HeartHandshake size={18} className="text-accent" aria-hidden="true" />
                {T("charityHeading")}
              </span>
              <form onSubmit={submitCharity} className="flex flex-col gap-tight sm:flex-row">
                <input
                  type="number"
                  min={0}
                  value={charityAmount}
                  onChange={event => setCharityAmount(event.target.value)}
                  placeholder={T("amountPlaceholder")}
                  className="w-full rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none sm:w-28"
                />
                <input
                  type="text"
                  value={charityNote}
                  onChange={event => setCharityNote(event.target.value)}
                  placeholder={T("notePlaceholder")}
                  className="w-full flex-1 rounded-control border border-line bg-background px-stack py-tight text-sm text-ink outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1 rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
                >
                  <Plus size={14} aria-hidden="true" />
                  {T("addButton")}
                </button>
              </form>

              {state.charity.length > 0 ? (
                <div className="flex flex-col gap-1">
                  {state.charity.map(entry => (
                    <div key={entry.id} className="flex items-center justify-between gap-tight rounded-control bg-mist px-stack py-tight text-sm">
                      <div className="flex flex-col">
                        <span className="text-ink">{entry.amount.toLocaleString(language === "sw" ? "sw-TZ" : "en-US")}</span>
                        {entry.note ? <span className="text-xs text-slate">{entry.note}</span> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setState(removeCharityEntry(state, entry.id))}
                        aria-label={T("removeEntry")}
                        className="text-slate transition-colors duration-base hover:text-danger"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  <span className="mt-1 text-right text-xs text-slate">
                    {T("charityTotalLabel")}: {charitySum.toLocaleString(language === "sw" ? "sw-TZ" : "en-US")}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate">{T("charityEmpty")}</p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
