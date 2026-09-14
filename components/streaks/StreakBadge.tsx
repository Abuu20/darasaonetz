import { Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useStreak } from "@/lib/hooks/useStreak";
import { effectiveCurrent, hasLoggedToday } from "@/lib/streaks/streakEngine";

// Lives in the header next to the notification bell — a constant, low-key
// reminder of the streak without needing its own page. Links through to the
// full StreakWidget on the Account dashboard for the day-by-day view.
export default function StreakBadge() {
  const { t } = useLanguage();
  const { streak } = useStreak();
  const current = effectiveCurrent(streak);
  const loggedToday = hasLoggedToday(streak);

  // Nothing to show yet for a brand-new student — avoids a permanent "0"
  // badge before they've done anything.
  if (current === 0) return null;

  const label = `${current} ${t("components.streaks.StreakBadge.dayStreak")}`;

  return (
    <Link
      to="/account"
      aria-label={label}
      title={label}
      className={`flex h-10 items-center gap-1 rounded-control px-2 text-sm font-semibold transition-colors duration-base ${
        loggedToday ? "text-ember" : "text-slate hover:text-ember"
      }`}
    >
      <Flame size={18} className={loggedToday ? "fill-ember/20" : ""} aria-hidden="true" />
      {current}
    </Link>
  );
}
