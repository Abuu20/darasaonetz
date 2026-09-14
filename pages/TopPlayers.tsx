import { useCallback, useEffect, useState } from "react";
import { Trophy } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { profileQueries } from "@/lib/db/profiles";
import type { Profile } from "@/lib/db/types";

const medal = ["🥇", "🥈", "🥉"];

export default function TopPlayers() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    profileQueries
      .getTopPlayers()
      .then(setPlayers)
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    return profileQueries.subscribeToTopPlayers(refresh);
  }, [refresh]);

  return (
    <>
      <SEOHead titleKey={t("pages.TopPlayers.seo.title")} descriptionKey={t("pages.TopPlayers.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span className="text-gradient-head text-sm uppercase tracking-widest">{t("pages.TopPlayers.eyebrow")}</span>
          <h1 className="mt-2 font-heading text-3xl text-ink md:text-4xl">{t("pages.TopPlayers.title")}</h1>
          <p className="mx-auto mt-2 max-w-prose text-ink/70">{t("pages.TopPlayers.paragraph")}</p>
        </section>

        <section className="mx-auto max-w-2xl px-gutter pb-block md:px-gutter-lg">
          {loading ? (
            <div className="flex flex-col gap-tight">
              {[0, 1, 2, 3, 4].map(i => (
                <div key={i} className="h-14 animate-pulse rounded-card bg-mist" />
              ))}
            </div>
          ) : players.length === 0 ? (
            <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
              <Trophy size={40} className="text-slate" aria-hidden="true" />
              <p className="text-sm text-slate">{t("pages.TopPlayers.empty")}</p>
            </div>
          ) : (
            <ol className="flex flex-col gap-tight">
              {players.map((player, index) => {
                const isMe = user?.id === player.id;
                return (
                  <li
                    key={player.id}
                    className={`flex items-center justify-between rounded-card border px-stack py-tight ${
                      isMe ? "border-accent bg-accent/10" : "border-hairline"
                    }`}
                  >
                    <span className="flex items-center gap-stack">
                      <span className="w-8 shrink-0 text-center text-lg">{medal[index] ?? index + 1}</span>
                      {player.avatar_url && (
                        <img src={player.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                      )}
                      <span className="font-medium text-ink">{player.full_name || t("pages.TopPlayers.anonymousPlayer")}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-heading text-ink">
                      <Trophy size={14} className="text-accent" aria-hidden="true" />
                      {player.total_points ?? 0}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </main>
    </>
  );
}
