import { useToolProgress } from "@/lib/hooks/useToolProgress";
import { EMPTY_STREAK, recordActivity, type StreakData } from "@/lib/streaks/streakEngine";

const LOCAL_KEY = "darasaone.streak.progress";

// Rides on the same `tool_progress` table every other tool already uses
// (Tasbih, Quran position, saved prayer-times location) — one more `tool`
// value, no new table or migration needed. Works signed-out too (localStorage
// only), same as the rest of that infra.
export function useStreak() {
  const [streak, setStreak] = useToolProgress<StreakData>("streak", LOCAL_KEY, EMPTY_STREAK);

  // Safe to call unconditionally from any completion event (lesson done,
  // quiz submitted, daily reminder read) — a no-op if today is already logged.
  const logActivity = () => {
    const next = recordActivity(streak);
    if (next !== streak) setStreak(next);
  };

  return { streak, logActivity };
}
