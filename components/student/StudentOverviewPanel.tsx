import { useEffect, useMemo, useState } from "react";
import { BookOpen, GraduationCap, Trophy, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { enrollmentQueries } from "@/lib/db/courses";
import { profileQueries } from "@/lib/db/profiles";
import { studentQuizQueries, type StudentAttemptRow } from "@/lib/db/quizzes";
import StatCard from "@/components/dashboard/StatCard";
import StreakWidget from "@/components/streaks/StreakWidget";
import {
  WeeklyActivityChart,
  CourseProgressDonut,
  LeaderboardRankCard,
  type WeekPoint,
  type CourseSlice,
} from "@/components/student/StudentCharts";
import type { Enrollment, Lesson } from "@/lib/db/types";

export default function StudentOverviewPanel() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [, setAttempts] = useState<StudentAttemptRow[]>([]);
  const [rank, setRank] = useState<{ rank: number; total: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      enrollmentQueries.getByStudent(user.id).catch(() => []),
      studentQuizQueries.getByStudent(user.id, 200).catch(() => []),
      profileQueries.getRank(user.id).catch(() => null),
    ])
      .then(([enr, att, rk]) => {
        setEnrollments(enr);
        setAttempts(att);
        setRank(rk);
      })
      .finally(() => setLoading(false));
  }, [user]);

  // Lesson completions come from the loaded enrollments' lessons subquery,
  // so we don't hit lesson_completions directly here — everything we need
  // for the charts is already on the enrollment rows.
  const completedLessonCount = useMemo(() => {
    let n = 0;
    for (const e of enrollments) {
      const lessons = (e.courses?.lessons ?? []) as Lesson[];
      n += lessons.filter(l => l.lesson_completions?.some(c => c.student_id === user?.id)).length;
    }
    return n;
  }, [enrollments, user?.id]);

  const totalLessonCount = useMemo(() => {
    let n = 0;
    for (const e of enrollments) {
      const lessons = (e.courses?.lessons ?? []) as Lesson[];
      n += lessons.length;
    }
    return n;
  }, [enrollments]);

  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((s, e) => s + (e.progress ?? 0), 0) / enrollments.length)
    : 0;

  const courseSlices: CourseSlice[] = useMemo(
    () => enrollments
      .map(e => ({ name: e.courses?.title ?? "Course", value: Math.round(e.progress ?? 0) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    [enrollments]
  );

  // Weekly lesson completions — derived by walking each enrollment's
  // lesson_completions list and bucketing by week. No extra query.
  const weeklyActivity: WeekPoint[] = useMemo(() => {
    const weeks = 12;
    const buckets = Array.from({ length: weeks }, (_, i) => {
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() - (weeks - 1 - i) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      return { label: `${start.getMonth() + 1}/${start.getDate()}`, lessons: 0, startMs: start.getTime(), endMs: end.getTime() };
    });

    for (const e of enrollments) {
      const lessons = (e.courses?.lessons ?? []) as Lesson[];
      for (const l of lessons) {
        for (const c of l.lesson_completions ?? []) {
          if (c.student_id !== user?.id) continue;
          const tMs = new Date(c.completed_at).getTime();
          for (const b of buckets) {
            if (tMs >= b.startMs && tMs <= b.endMs) { b.lessons += 1; break; }
          }
        }
      }
    }
    return buckets.map(({ label, lessons }) => ({ label, lessons }));
  }, [enrollments, user?.id]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-stack lg:grid-cols-4">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="h-24 animate-pulse rounded-card bg-mist" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-shell flex-col gap-block">
      {/* Stat row */}
      <div className="grid grid-cols-2 gap-stack lg:grid-cols-4">
        <StatCard icon={Trophy} value={profile?.total_points ?? 0} label={t("pages.Account.statPoints")} />
        <StatCard icon={GraduationCap} value={enrollments.length} label={t("pages.Account.statCourses")} />
        <StatCard
          icon={TrendingUp}
          value={`${avgProgress}%`}
          label={t("pages.Account.statProgress")}
          delta={{ value: `${completedLessonCount}/${totalLessonCount}`, tone: "flat" }}
        />
        <StatCard icon={BookOpen} value={completedLessonCount} label={t("pages.Account.statLessons")} />
      </div>

      {/* Streak + rank */}
      <div className="grid grid-cols-1 gap-stack lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <StreakWidget />
        <LeaderboardRankCard rank={rank?.rank ?? null} total={rank?.total ?? null} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-stack lg:grid-cols-2">
        <WeeklyActivityChart data={weeklyActivity} />
        <CourseProgressDonut slices={courseSlices} />
      </div>
    </div>
  );
}
