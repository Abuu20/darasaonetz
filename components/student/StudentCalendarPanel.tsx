import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ClipboardCheck,
  MapPin,
} from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday as isTodayFn,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { enrollmentQueries, lessonCompletionQueries } from "@/lib/db/courses";
import { studentQuizQueries, type StudentAttemptRow } from "@/lib/db/quizzes";
import { useStreak } from "@/lib/hooks/useStreak";
import { useHijriToday } from "@/lib/quran/useHijriToday";
import { useToolProgress } from "@/lib/hooks/useToolProgress";
import { DEFAULT_CALCULATION_METHOD, prayerApi, type PrayerTimesResponse } from "@/lib/quran/prayerApi";
import StatCard from "@/components/dashboard/StatCard";
import type { Enrollment } from "@/lib/db/types";

interface LessonCompletion {
  lesson_id: string;
  course_id: string;
  completed_at: string;
}

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRAYER_ORDER = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;

// Matches the fallback used by pages/tools/PrayerTimes.tsx so a student who
// hasn't set a location yet still sees real live timings, not a blank card.
const DEFAULT_CITY = "Dar es Salaam";
const DEFAULT_COUNTRY = "Tanzania";

function cleanTime(raw: string): string {
  // Aladhan sometimes appends a timezone abbreviation, e.g. "05:12 (EAT)".
  return raw.split(" ")[0];
}

/**
 * Every dot on this calendar comes from something the student actually did
 * (a lesson finished, a quiz submitted, a streak day logged) — no invented
 * assignments or deadlines, since the platform doesn't schedule those yet.
 * The prayer-times card is genuinely live (Aladhan API) and the Hijri date
 * comes from the same source the Quran/Ramadan tools already use.
 */
export default function StudentCalendarPanel() {
  const { user } = useAuth();
  const { streak } = useStreak();
  const { hijri, loading: hijriLoading } = useHijriToday();
  const [savedLocation] = useToolProgress("prayer-times", "darasaone.prayerTimes.progress", {
    city: DEFAULT_CITY,
    country: DEFAULT_COUNTRY,
    method: DEFAULT_CALCULATION_METHOD,
  });

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [completions, setCompletions] = useState<LessonCompletion[]>([]);
  const [attempts, setAttempts] = useState<StudentAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date());
  const [timings, setTimings] = useState<PrayerTimesResponse | null>(null);
  const [timingsError, setTimingsError] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      enrollmentQueries.getByStudent(user.id).catch(() => []),
      lessonCompletionQueries.getByStudent(user.id).catch(() => []),
      studentQuizQueries.getByStudent(user.id, 200).catch(() => []),
    ])
      .then(([enr, comp, att]) => {
        setEnrollments(enr);
        setCompletions(comp);
        setAttempts(att);
      })
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    setTimingsError(false);
    prayerApi
      .getTimingsByCity(savedLocation.city, savedLocation.country, savedLocation.method)
      .then(setTimings)
      .catch(() => setTimingsError(true));
  }, [savedLocation.city, savedLocation.country, savedLocation.method]);

  const courseTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enrollments) if (e.courses?.title) map.set(e.course_id, e.courses.title);
    return map;
  }, [enrollments]);

  const lessonTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enrollments) {
      const lessons = (e.courses?.lessons ?? []) as { id: string; title: string }[];
      for (const l of lessons) if (l?.id) map.set(l.id, l.title);
    }
    return map;
  }, [enrollments]);

  // "yyyy-MM-dd" -> how many lessons/quizzes landed on that real calendar day.
  const dayIndex = useMemo(() => {
    const map = new Map<string, { lessons: number; quizzes: number }>();
    const bump = (key: string, field: "lessons" | "quizzes") => {
      const entry = map.get(key) ?? { lessons: 0, quizzes: 0 };
      entry[field] += 1;
      map.set(key, entry);
    };
    for (const c of completions) bump(format(new Date(c.completed_at), "yyyy-MM-dd"), "lessons");
    for (const a of attempts) bump(format(new Date(a.submitted_at), "yyyy-MM-dd"), "quizzes");
    return map;
  }, [completions, attempts]);

  const activeStreakDays = useMemo(() => new Set(streak.activeDates), [streak.activeDates]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = useMemo(
    () => eachDayOfInterval({ start: gridStart, end: gridEnd }),
    [gridStart, gridEnd]
  );

  const monthStats = useMemo(() => {
    let lessons = 0;
    let quizzes = 0;
    let activeDays = 0;
    for (const day of eachDayOfInterval({ start: monthStart, end: monthEnd })) {
      const key = format(day, "yyyy-MM-dd");
      const entry = dayIndex.get(key);
      if (entry) {
        lessons += entry.lessons;
        quizzes += entry.quizzes;
      }
      if (entry || activeStreakDays.has(key)) activeDays += 1;
    }
    return { lessons, quizzes, activeDays };
  }, [dayIndex, activeStreakDays, monthStart, monthEnd]);

  const recentActivity = useMemo(() => {
    type Item = { id: string; kind: "lesson" | "quiz"; title: string; sub: string; at: string };
    const items: Item[] = [];
    for (const c of completions) {
      items.push({
        id: `lesson-${c.lesson_id}-${c.completed_at}`,
        kind: "lesson",
        title: lessonTitleById.get(c.lesson_id) ?? "Lesson completed",
        sub: courseTitleById.get(c.course_id) ?? "",
        at: c.completed_at,
      });
    }
    for (const a of attempts) {
      items.push({
        id: `quiz-${a.id}`,
        kind: "quiz",
        title: a.quiz_title ?? "Quiz",
        sub: a.passed ? `Passed · ${a.score}%` : `${a.score}%`,
        at: a.submitted_at,
      });
    }
    return items.sort((x, y) => new Date(y.at).getTime() - new Date(x.at).getTime()).slice(0, 8);
  }, [completions, attempts, lessonTitleById, courseTitleById]);

  const nextPrayer = useMemo(() => {
    if (!timings) return null;
    const now = new Date();
    for (const name of PRAYER_ORDER) {
      const time = cleanTime(timings.timings[name]);
      const [h, m] = time.split(":").map(Number);
      const candidate = new Date();
      candidate.setHours(h, m, 0, 0);
      if (candidate.getTime() > now.getTime()) return { name, time };
    }
    return { name: "Fajr", time: cleanTime(timings.timings.Fajr) };
  }, [timings]);

  if (loading) {
    return (
      <div className="flex flex-col gap-block">
        <div className="grid grid-cols-3 gap-stack">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-mist" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-card bg-mist" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-block">
      <div className="grid grid-cols-3 gap-stack">
        <StatCard icon={CalendarDays} value={monthStats.activeDays} label="Active days this month" />
        <StatCard icon={BookOpen} value={monthStats.lessons} label="Lessons completed" />
        <StatCard icon={ClipboardCheck} value={monthStats.quizzes} label="Quizzes taken" />
      </div>

      <div className="grid grid-cols-1 gap-block lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        {/* Month grid */}
        <section className="card-lift flex flex-col gap-stack rounded-card border border-line bg-background p-block">
          <div className="flex flex-wrap items-center justify-between gap-stack">
            <div>
              <h2 className="font-heading text-lg text-ink">{format(month, "MMMM yyyy")}</h2>
              {!hijriLoading && hijri ? (
                <p className="text-xs text-slate">
                  {hijri.day} {hijri.month.en} {hijri.year} AH
                </p>
              ) : null}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMonth(m => subMonths(m, 1))}
                aria-label="Previous month"
                className="rounded-control border border-line p-1.5 text-slate transition-colors duration-base hover:text-ink"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setMonth(new Date())}
                className="rounded-control border border-line px-2.5 py-1 text-xs text-slate transition-colors duration-base hover:text-ink"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setMonth(m => addMonths(m, 1))}
                aria-label="Next month"
                className="rounded-control border border-line p-1.5 text-slate transition-colors duration-base hover:text-ink"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-block text-[11px] text-slate">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-accent" /> Lesson completed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-[#a855f7]" /> Quiz taken
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-pill bg-ember" /> Streak day
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-slate">
            {WEEKDAY_LABELS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const entry = dayIndex.get(key);
              const streakDay = activeStreakDays.has(key);
              const inMonth = isSameMonth(day, month);
              const today = isTodayFn(day);
              return (
                <div
                  key={key}
                  className={`flex min-h-[56px] flex-col gap-1 rounded-panel border p-1.5 transition-colors duration-base sm:min-h-[68px] ${
                    today ? "border-accent bg-accent/5" : "border-line"
                  } ${inMonth ? "" : "opacity-35"}`}
                >
                  <span className={`text-xs ${today ? "font-semibold text-accent" : "text-ink"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {entry?.lessons ? (
                      <span
                        className="h-1.5 w-1.5 rounded-pill bg-accent"
                        title={`${entry.lessons} lesson(s) completed`}
                      />
                    ) : null}
                    {entry?.quizzes ? (
                      <span
                        className="h-1.5 w-1.5 rounded-pill bg-[#a855f7]"
                        title={`${entry.quizzes} quiz attempt(s)`}
                      />
                    ) : null}
                    {streakDay ? (
                      <span className="h-1.5 w-1.5 rounded-pill bg-ember" title="Streak day" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Sidebar: live prayer times + recent activity */}
        <div className="flex flex-col gap-stack">
          <div className="card-lift flex flex-col gap-stack rounded-card border border-line bg-background p-block">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 font-heading text-sm text-ink">
                <Clock size={15} className="text-accent" aria-hidden="true" />
                Prayer times
              </h3>
              <span className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-success">
                <span className="h-1.5 w-1.5 animate-pulse rounded-pill bg-success" />
                Live
              </span>
            </div>
            <p className="flex items-center gap-1 text-xs text-slate">
              <MapPin size={12} aria-hidden="true" />
              {savedLocation.city}, {savedLocation.country}
            </p>
            {timingsError ? (
              <p className="text-xs text-slate">Couldn't load today's timings — try again shortly.</p>
            ) : nextPrayer ? (
              <div className="rounded-panel border border-line bg-mist p-stack text-center">
                <p className="text-[11px] uppercase tracking-widest text-slate">Next: {nextPrayer.name}</p>
                <p className="font-heading text-2xl text-ink">{nextPrayer.time}</p>
              </div>
            ) : (
              <div className="h-16 animate-pulse rounded-panel bg-mist" />
            )}
            <Link to="/tools/prayer-times" className="text-center text-xs font-medium text-accent hover:underline">
              Open prayer times →
            </Link>
          </div>

          <div className="card-lift flex flex-col gap-stack rounded-card border border-line bg-background p-block">
            <h3 className="font-heading text-sm text-ink">Recent activity</h3>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate">
                Nothing yet — finish a lesson or take a quiz and it'll show up here.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {recentActivity.map(item => (
                  <li key={item.id} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-pill ${
                        item.kind === "lesson" ? "bg-accent/10 text-accent" : "bg-[#a855f7]/10 text-[#a855f7]"
                      }`}
                    >
                      {item.kind === "lesson" ? <BookOpen size={12} /> : <ClipboardCheck size={12} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-ink">{item.title}</span>
                      <span className="block text-xs text-slate">
                        {item.sub ? `${item.sub} · ` : ""}
                        {format(new Date(item.at), "MMM d")}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
