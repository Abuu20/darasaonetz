import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  UserPlus,
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
import { teacherActivityQueries, type ActivityEvent } from "@/lib/db/teacherActivity";
import StatCard from "@/components/dashboard/StatCard";
import type { Course } from "@/lib/db/types";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const DOT_COLOR: Record<ActivityEvent["type"], string> = {
  enrollment: "bg-success",
  lesson_completion: "bg-accent",
  quiz_attempt: "bg-[#a855f7]",
  review: "bg-ember",
};

const TYPE_LABEL: Record<ActivityEvent["type"], string> = {
  enrollment: "New enrollment",
  lesson_completion: "Lesson completed",
  quiz_attempt: "Quiz submitted",
  review: "New review",
};

interface TeacherCalendarPanelProps {
  courses: Course[];
}

/**
 * Every dot here is something that actually happened in one of the
 * teacher's courses — enrollments, lesson completions, quiz submissions,
 * reviews. There's no due-date field on lessons/quizzes in the schema, so
 * this can't be a deadline planner, only an activity log — same
 * constraint StudentCalendarPanel documents for the student side.
 */
export default function TeacherCalendarPanel({ courses }: TeacherCalendarPanelProps) {
  const courseIds = useMemo(() => courses.map(c => c.id), [courses]);
  const courseTitleById = useMemo(() => new Map(courses.map(c => [c.id, c.title])), [courses]);

  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  useEffect(() => {
    if (courseIds.length === 0) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    teacherActivityQueries
      .getForCourses(courseIds)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseIds.join(",")]);

  const dayIndex = useMemo(() => {
    const map = new Map<string, ActivityEvent[]>();
    for (const e of events) {
      const key = format(new Date(e.at), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(e);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days = useMemo(() => eachDayOfInterval({ start: gridStart, end: gridEnd }), [gridStart, gridEnd]);

  const monthStats = useMemo(() => {
    let enrollments = 0;
    let lessons = 0;
    let quizzes = 0;
    for (const day of eachDayOfInterval({ start: monthStart, end: monthEnd })) {
      const entry = dayIndex.get(format(day, "yyyy-MM-dd")) ?? [];
      for (const e of entry) {
        if (e.type === "enrollment") enrollments += 1;
        if (e.type === "lesson_completion") lessons += 1;
        if (e.type === "quiz_attempt") quizzes += 1;
      }
    }
    return { enrollments, lessons, quizzes };
  }, [dayIndex, monthStart, monthEnd]);

  const dayEvents = selectedDay ? dayIndex.get(selectedDay) ?? [] : [];

  if (courses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
        <p className="text-sm text-slate">Create a course first — activity shows up here once students start engaging with it.</p>
      </div>
    );
  }

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
        <StatCard icon={UserPlus} value={monthStats.enrollments} label="New enrollments this month" />
        <StatCard icon={BookOpen} value={monthStats.lessons} label="Lessons completed" />
        <StatCard icon={ClipboardCheck} value={monthStats.quizzes} label="Quizzes submitted" />
      </div>

      <div className="grid grid-cols-1 gap-block lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="card-lift flex flex-col gap-stack rounded-card border border-line bg-background p-block">
          <div className="flex flex-wrap items-center justify-between gap-stack">
            <h2 className="font-heading text-lg text-ink">{format(month, "MMMM yyyy")}</h2>
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
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-success" /> Enrollment</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-accent" /> Lesson completed</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-[#a855f7]" /> Quiz submitted</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-pill bg-ember" /> Review</span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-slate">
            {WEEKDAY_LABELS.map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map(day => {
              const key = format(day, "yyyy-MM-dd");
              const entry = dayIndex.get(key) ?? [];
              const inMonth = isSameMonth(day, month);
              const today = isTodayFn(day);
              const selected = selectedDay === key;
              const types = [...new Set(entry.map(e => e.type))];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => setSelectedDay(entry.length ? key : null)}
                  className={`flex min-h-[56px] flex-col gap-1 rounded-panel border p-1.5 text-left transition-colors duration-base sm:min-h-[68px] ${
                    selected ? "border-accent bg-accent/10" : today ? "border-accent bg-accent/5" : "border-line"
                  } ${inMonth ? "" : "opacity-35"}`}
                >
                  <span className={`text-xs ${today ? "font-semibold text-accent" : "text-ink"}`}>{format(day, "d")}</span>
                  <div className="mt-auto flex flex-wrap gap-1">
                    {types.map(t => (
                      <span key={t} className={`h-1.5 w-1.5 rounded-pill ${DOT_COLOR[t]}`} title={TYPE_LABEL[t]} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="card-lift flex flex-col gap-stack rounded-card border border-line bg-background p-block">
          <h2 className="font-heading text-lg text-ink">
            {selectedDay ? format(new Date(`${selectedDay}T00:00:00`), "MMM d, yyyy") : "Recent activity"}
          </h2>
          {(selectedDay ? dayEvents : events.slice(0, 10)).length === 0 ? (
            <p className="text-sm text-slate">Nothing here yet.</p>
          ) : (
            <ul className="flex flex-col gap-stack">
              {(selectedDay ? dayEvents : events.slice(0, 10)).map((e, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-pill ${DOT_COLOR[e.type]}`} />
                  <div className="flex flex-col">
                    <span className="text-ink">
                      <span className="font-medium">{e.student_name ?? "A student"}</span> — {e.detail}
                    </span>
                    <span className="text-xs text-slate">
                      {courseTitleById.get(e.course_id) ?? "Course"} · {format(new Date(e.at), "MMM d, h:mm a")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
