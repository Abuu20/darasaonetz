import { Flame, Check } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/lib/hooks/useStreak";
import { effectiveCurrent, hasLoggedToday, lastNDays, STREAK_MILESTONES } from "@/lib/streaks/streakEngine";
import { todaysEntry } from "@/lib/streaks/dailyContent";

const DAY_LABEL_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export default function StreakWidget() {
  const { t, language } = useLanguage();
  const T = (key: string) => t(`components.streaks.StreakWidget.${key}`);
  const { streak, logActivity } = useStreak();

  const current = effectiveCurrent(streak);
  const loggedToday = hasLoggedToday(streak);
  const week = lastNDays(streak, 7);
  const nextMilestone = STREAK_MILESTONES.find(m => m > current);
  const entry = todaysEntry();

  return (
    <section className="flex flex-col gap-block rounded-card border border-hairline bg-panel p-block">
      <div className="flex flex-wrap items-center justify-between gap-stack">
        <div className="flex items-center gap-tight">
          <span className="gradient-head flex h-12 w-12 items-center justify-center rounded-pill">
            <Flame size={22} className="text-ember-foreground" aria-hidden="true" />
          </span>
          <div className="flex flex-col">
            <span className="font-heading text-3xl leading-none">{current}</span>
            <span className="text-xs uppercase tracking-widest text-lavender">
              {current === 1 ? T("dayStreakSingular") : T("dayStreakPlural")}
            </span>
          </div>
        </div>
        {streak.longest > 0 ? (
          <span className="text-xs text-lilac">
            {T("longest")}: {streak.longest}
          </span>
        ) : null}
      </div>

      {current === 0 ? <p className="text-sm text-lilac">{T("subtitleZero")}</p> : null}

      <div className="flex items-center justify-between gap-1">
        {week.map(day => {
          const label = new Date(`${day.date}T00:00:00`).getDay();
          return (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-pill border text-xs transition-colors duration-base ${
                  day.active ? "border-transparent bg-ember text-ember-foreground" : "border-hairline text-slate"
                }`}
              >
                {day.active ? <Check size={14} aria-hidden="true" /> : ""}
              </span>
              <span className="text-[10px] uppercase text-slate">{T(`day.${DAY_LABEL_KEYS[label]}`)}</span>
            </div>
          );
        })}
      </div>

      {nextMilestone ? (
        <p className="text-xs text-lavender">
          {nextMilestone - current} {T("daysToNext")} {nextMilestone} {T("dayBadge")}
        </p>
      ) : null}

      <div className="flex flex-col gap-tight rounded-panel border border-hairline bg-night/40 p-stack">
        <span className="text-xs uppercase tracking-widest text-lavender">{T("todayLabel")}</span>
        <p className="text-sm text-night-foreground">{language === "sw" ? entry.sw : entry.en}</p>
        <div className="flex items-center justify-between gap-stack">
          <span className="text-xs text-lilac">{language === "sw" ? entry.sourceSw : entry.sourceEn}</span>
          {loggedToday ? (
            <span className="flex items-center gap-1 text-xs text-success">
              <Check size={14} aria-hidden="true" />
              {T("loggedToday")}
            </span>
          ) : (
            <button
              type="button"
              onClick={logActivity}
              className="gradient-brand rounded-control px-stack py-1 text-xs text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active"
            >
              {T("markRead")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
