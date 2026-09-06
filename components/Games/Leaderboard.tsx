import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import { gameScoreQueries } from "@/lib/db/games";
import type { GameScore } from "@/lib/db/types";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

interface LeaderboardProps {
  gameId: string;
}

const medal = ["🥇", "🥈", "🥉"];

export default function Leaderboard({ gameId }: LeaderboardProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [scores, setScores] = useState<GameScore[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    gameScoreQueries
      .getLeaderboard(gameId)
      .then(setScores)
      .catch(() => setScores([]))
      .finally(() => setLoading(false));
  }, [gameId]);

  useEffect(() => {
    refresh();
    // Scoped to this one game's channel — a visitor only subscribes to the
    // leaderboard they're actually viewing, not every game on the site.
    return gameScoreQueries.subscribeToLeaderboard(gameId, refresh);
  }, [gameId, refresh]);

  return (
    <aside className="flex h-fit flex-col gap-tight rounded-card border border-hairline px-stack py-stack">
      <div className="flex items-center gap-1 font-heading text-ink">
        <Trophy size={18} className="text-accent" aria-hidden="true" />
        {t("pages.GamePlayer.leaderboardTitle")}
      </div>

      {loading ? (
        <div className="flex flex-col gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-6 animate-pulse rounded-control bg-mist" />
          ))}
        </div>
      ) : scores.length === 0 ? (
        <p className="text-sm text-slate">{t("pages.GamePlayer.leaderboardEmpty")}</p>
      ) : (
        <ol className="flex flex-col gap-1">
          {scores.map((entry, index) => {
            const isMe = user?.id === entry.user_id;
            return (
              <li
                key={entry.id}
                className={`flex items-center justify-between rounded-control px-tight py-1 text-sm ${
                  isMe ? "bg-accent/10 text-ink" : "text-slate"
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <span className="w-5 shrink-0 text-center">{medal[index] ?? index + 1}</span>
                  <span className="truncate">{entry.profiles?.full_name || t("pages.GamePlayer.anonymousPlayer")}</span>
                </span>
                <span className="shrink-0 font-medium text-ink">{entry.score}</span>
              </li>
            );
          })}
        </ol>
      )}
    </aside>
  );
}
