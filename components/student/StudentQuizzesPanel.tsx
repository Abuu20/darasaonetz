import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ClipboardCheck, Target, CheckCircle2, Award } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { studentQuizQueries, type StudentAttemptRow } from "@/lib/db/quizzes";
import StatCard from "@/components/dashboard/StatCard";
import { QuizScoreHistory, type ScorePoint } from "@/components/student/StudentCharts";

export default function StudentQuizzesPanel() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<StudentAttemptRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    studentQuizQueries
      .getByStudent(user.id, 200)
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, [user]);

  const stats = useMemo(() => {
    if (attempts.length === 0) return { taken: 0, avg: 0, passRate: 0, best: 0 };
    const avg = Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length);
    const passed = attempts.filter(a => a.passed).length;
    const best = Math.max(...attempts.map(a => a.score));
    return { taken: attempts.length, avg, passRate: Math.round((passed / attempts.length) * 100), best };
  }, [attempts]);

  // Oldest-first for the chart, so the line reads left→right in time order.
  const scoreHistory: ScorePoint[] = useMemo(
    () =>
      [...attempts]
        .reverse()
        .map(a => ({
          label: new Date(a.submitted_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
          score: a.score,
          passed: a.passed,
        })),
    [attempts]
  );

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
    <div className="flex flex-col gap-block">
      <div className="grid grid-cols-2 gap-stack lg:grid-cols-4">
        <StatCard icon={ClipboardCheck} value={stats.taken} label="Quizzes taken" />
        <StatCard icon={Target} value={`${stats.avg}%`} label="Average score" />
        <StatCard icon={CheckCircle2} value={`${stats.passRate}%`} label="Pass rate" />
        <StatCard icon={Award} value={`${stats.best}%`} label="Best score" />
      </div>

      <QuizScoreHistory data={scoreHistory} />

      <section className="flex flex-col gap-stack">
        <h2 className="font-heading text-lg text-ink">Recent attempts</h2>

        {attempts.length === 0 ? (
          <div className="card-lift flex flex-col items-center gap-stack rounded-card border border-line bg-background p-block text-center">
            <ClipboardCheck size={28} className="text-slate" aria-hidden="true" />
            <p className="text-sm text-slate">
              No quiz attempts yet. They'll show up here after you take your first one.
            </p>
            <Link
              to="/courses"
              className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="card-lift overflow-hidden rounded-card border border-line bg-background">
            <div className="hidden grid-cols-[minmax(0,2.4fr)_120px_110px_110px] items-center gap-stack border-b border-line px-block py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate lg:grid">
              <span>Quiz</span>
              <span>Date</span>
              <span>Points</span>
              <span className="text-right">Score</span>
            </div>
            {attempts.slice(0, 30).map(a => (
              <div
                key={a.id}
                className="grid grid-cols-1 items-center gap-stack border-b border-line px-block py-stack last:border-b-0 lg:grid-cols-[minmax(0,2.4fr)_120px_110px_110px]"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink">{a.quiz_title ?? "Quiz"}</p>
                  <span className={`mt-0.5 inline-block rounded-pill px-2 py-0.5 text-[10px] uppercase tracking-widest ${a.passed ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                    {a.passed ? "Passed" : "Not passed"}
                  </span>
                </div>
                <div className="text-xs text-slate">
                  {new Date(a.submitted_at).toLocaleDateString(undefined, { dateStyle: "medium" })}
                </div>
                <div className="text-xs text-slate">
                  {a.points_earned}/{a.points_possible} pts
                </div>
                <div className={`text-right text-sm font-medium ${a.passed ? "text-success" : "text-danger"}`}>
                  {a.score}%
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
