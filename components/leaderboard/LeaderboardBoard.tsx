import { useCallback, useEffect, useState } from "react";
import { Award, Crown, Flame, Trophy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { leaderboardQueries, type LeaderboardRow, type LeaderboardWindow } from "@/lib/db/leaderboard";
import { getLevel } from "@/lib/leaderboard/levels";
import { useStreak } from "@/lib/hooks/useStreak";
import { effectiveCurrent } from "@/lib/streaks/streakEngine";
import StatCard from "@/components/dashboard/StatCard";

const WINDOWS: { id: LeaderboardWindow; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "alltime", label: "All Time" },
];

interface LeaderboardBoardProps {
  scope: "global" | "class";
  teacherId?: string; // required when scope === "class"
  title?: string;
  emptyMessage?: string;
}

/**
 * Points/streak/badges/course-count all come from real data (see
 * lib/db/leaderboard.ts + supabase-leaderboard-v2.sql). Weekly/Monthly
 * will read 0 for everyone until the points ledger has had time to
 * accumulate new events post-migration — that's a data limitation, not
 * a bug in this component.
 */
export default function LeaderboardBoard({ scope, teacherId, title, emptyMessage }: LeaderboardBoardProps) {
  const { user } = useAuth();
  const { streak } = useStreak();
  const [window_, setWindow] = useState<LeaderboardWindow>("alltime");
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    const load =
      scope === "class" && teacherId
        ? leaderboardQueries.getClass(teacherId, window_)
        : leaderboardQueries.getGlobal(window_);
    load
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [scope, teacherId, window_]);

  useEffect(() => {
    setLoading(true);
    refresh();
    return leaderboardQueries.subscribe(refresh);
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex flex-col gap-block">
        <div className="grid grid-cols-2 gap-stack md:grid-cols-4">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="h-24 animate-pulse rounded-card bg-mist" />
          ))}
        </div>
        <div className="h-16 animate-pulse rounded-card bg-mist" />
        <div className="grid grid-cols-3 gap-stack">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-32 animate-pulse rounded-card bg-mist" />
          ))}
        </div>
      </div>
    );
  }

  const myIndex = rows.findIndex(r => r.user_id === user?.id);
  const me = myIndex >= 0 ? rows[myIndex] : null;
  const myLevel = getLevel(me?.points_all_time ?? 0);
  const currentStreak = effectiveCurrent(streak);

  const top3 = rows.slice(0, 3);
  const podiumOrder: (LeaderboardRow | undefined)[] = [top3[1], top3[0], top3[2]];

  return (
    <div className="flex flex-col gap-block">
      <div className="grid grid-cols-2 gap-stack md:grid-cols-4">
        <StatCard icon={Crown} value={myIndex >= 0 ? `#${myIndex + 1}` : "—"} label="Your Rank" />
        <StatCard icon={Trophy} value={me?.points_all_time ?? 0} label="Your XP" />
        <StatCard icon={Flame} value={currentStreak} label="Current Streak" delta={{ value: `Best: ${streak.longest}`, tone: "flat" }} />
        <StatCard icon={Award} value={me?.badge_count ?? 0} label="Badges Earned" />
      </div>

      {me ? (
        <div className="card-lift flex flex-wrap items-center justify-between gap-stack rounded-card border border-accent bg-accent/10 p-stack">
          <div className="flex items-center gap-stack">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-pill bg-accent text-sm font-semibold text-white">
              #{myIndex + 1}
            </span>
            {me.avatar_url ? (
              <img src={me.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-mist text-sm text-slate">
                {(me.full_name || "?").charAt(0).toUpperCase()}
              </span>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-ink">{me.full_name || "You"} (You)</span>
              <span className="text-xs text-slate">Level {myLevel.level} · {myLevel.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-block text-sm text-ink">
            <span className="inline-flex items-center gap-1"><Trophy size={12} className="text-accent" aria-hidden="true" />{me.points_all_time} XP</span>
            <span className="inline-flex items-center gap-1"><Flame size={12} className="text-ember" aria-hidden="true" />{currentStreak} day streak</span>
            <span className="inline-flex items-center gap-1"><Award size={12} className="text-accent" aria-hidden="true" />{me.badge_count} badges</span>
          </div>
        </div>
      ) : null}

      <div className="card-lift flex flex-col gap-block rounded-card border border-line bg-background p-block">
        <div className="flex flex-wrap items-center justify-between gap-stack">
          <h2 className="font-heading text-lg text-ink">{title ?? (scope === "class" ? "Class leaderboard" : "Global leaderboard")}</h2>
          <div className="flex items-center gap-1 rounded-pill border border-line p-0.5">
            {WINDOWS.map(w => (
              <button
                key={w.id}
                type="button"
                onClick={() => setWindow(w.id)}
                className={`rounded-pill px-3 py-1 text-xs font-medium transition-colors duration-base ${
                  window_ === w.id ? "bg-accent text-white" : "text-slate hover:text-ink"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
            <Trophy size={40} className="text-slate" aria-hidden="true" />
            <p className="text-sm text-slate">
              {emptyMessage ?? (scope === "class" ? "No students enrolled yet." : "No one has scored points yet.")}
            </p>
          </div>
        ) : (
          <>
            {top3.length > 0 ? (
              <div className="grid grid-cols-3 items-end gap-stack">
                {podiumOrder.map((row, i) =>
                  row ? (
                    <PodiumCard
                      key={row.user_id}
                      row={row}
                      place={(i === 1 ? 1 : i === 0 ? 2 : 3) as 1 | 2 | 3}
                      isMe={user?.id === row.user_id}
                    />
                  ) : (
                    <div key={`empty-${i}`} />
                  )
                )}
              </div>
            ) : null}

            {/* Full table — rank, level, XP, badges, courses, streak. Streak
                shown here is each row's *longest* streak (from their
                tool_progress row), not "current", since current-streak
                grace-period logic is client-side day math we don't want to
                duplicate per-row for a whole roster. */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase tracking-widest text-slate">
                    <th className="py-2 pr-2">Rank</th>
                    <th className="py-2 pr-2">Student</th>
                    <th className="py-2 pr-2 text-right">Level</th>
                    <th className="py-2 pr-2 text-right">XP Points</th>
                    <th className="py-2 pr-2 text-right">Badges</th>
                    <th className="py-2 pr-2 text-right">Courses</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const isMe = user?.id === row.user_id;
                    const level = getLevel(row.points_all_time);
                    return (
                      <tr key={row.user_id} className={`border-b border-line/60 ${isMe ? "bg-accent/10" : ""}`}>
                        <td className="py-2 pr-2 text-slate">{index + 1}</td>
                        <td className="py-2 pr-2">
                          <span className="flex min-w-0 items-center gap-2">
                            {row.avatar_url ? (
                              <img src={row.avatar_url} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                            ) : (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mist text-[10px] text-slate">
                                {(row.full_name || "?").charAt(0).toUpperCase()}
                              </span>
                            )}
                            <span className="truncate text-ink">
                              {row.full_name || "Anonymous"}
                              {isMe ? " (You)" : ""}
                            </span>
                          </span>
                        </td>
                        <td className="py-2 pr-2 text-right text-ink">{level.level}</td>
                        <td className="py-2 pr-2 text-right font-medium text-ink">{row.points_in_window}</td>
                        <td className="py-2 pr-2 text-right text-ink">{row.badge_count}</td>
                        <td className="py-2 pr-2 text-right text-ink">{row.course_count}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function PodiumCard({ row, place, isMe }: { row: LeaderboardRow; place: 1 | 2 | 3; isMe: boolean }) {
  const height = place === 1 ? "h-28" : place === 2 ? "h-20" : "h-16";
  const medal = place === 1 ? "🥇" : place === 2 ? "🥈" : "🥉";
  const level = getLevel(row.points_all_time);
  return (
    <div className="flex flex-col items-center gap-1">
      {row.avatar_url ? (
        <img src={row.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mist text-sm text-slate">
          {(row.full_name || "?").charAt(0).toUpperCase()}
        </span>
      )}
      <span className={`max-w-[92px] truncate text-xs ${isMe ? "font-semibold text-accent" : "text-ink"}`}>
        {row.full_name || "Anonymous"}
        {isMe ? " (You)" : ""}
      </span>
      <span className="text-xs text-slate">Lv.{level.level} · {row.points_in_window} XP</span>
      <div
        className={`flex w-full items-start justify-center rounded-t-panel bg-gradient-to-b from-accent/20 to-accent/5 pt-1.5 ${height}`}
      >
        <span className="text-lg">{medal}</span>
      </div>
    </div>
  );
}
