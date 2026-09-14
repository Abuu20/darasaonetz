import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Maximize, Minimize } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { gameQueries, gameScoreQueries } from "@/lib/db/games";
import type { Game } from "@/lib/db/types";
import Leaderboard from "@/components/Games/Leaderboard";

// Same sandboxing rationale as before: the game is a self-contained HTML/JS
// file with its own global scope, so it runs in an <iframe> rather than
// being inlined into this component. This page (and the game file it
// points at) only load for someone who opens a specific /games/:slug URL —
// the hub page above never downloads any game's code, just its metadata row.
export default function GamePlayer() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Native Fullscreen API on the frame div (not the iframe) — the iframe
  // just fills whatever size its parent becomes, fullscreen or not, so no
  // extra "allow=fullscreen" permission is needed on the iframe itself.
  // Listening for the browser's own fullscreenchange event (rather than
  // only setting state on click) keeps this in sync when the user exits
  // via Esc or the browser's own UI, not just our button.
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(document.fullscreenElement === frameRef.current);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!frameRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      frameRef.current.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setIframeLoaded(false);
    gameQueries
      .getBySlug(slug)
      .then(setGame)
      .catch(() => setGame(null))
      .finally(() => setLoading(false));
  }, [slug]);

  // Standard message contract for every Darasaone game (sandboxed in an
  // iframe, so this is the only way it can reach Supabase):
  //   game → host: { source: 'darasaone-game', gameSlug, type: 'game-complete', pointsEarned }
  //   game → host: { source: 'darasaone-game', gameSlug, type: 'get-leaderboard', requestId, numEntries }
  //   host → game: { source: 'darasaone-host', type: 'leaderboard-response', requestId, entries }
  // Score recording needs a signed-in user; reading the leaderboard doesn't
  // (it's public), so that branch runs regardless of `user`.
  useEffect(() => {
    if (!game) return;
    const gameId = game.id;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as
        | { source?: string; type?: string; pointsEarned?: number; requestId?: string; numEntries?: number }
        | undefined;
      if (data?.source !== "darasaone-game") return;

      if (data.type === "game-complete" && user) {
        const pointsEarned = Number(data.pointsEarned);
        if (!Number.isFinite(pointsEarned) || pointsEarned <= 0) return;
        gameScoreQueries.awardPoints(gameId, user.id, pointsEarned).catch(err => {
          console.error("[GamePlayer] failed to record score:", err);
        });
        return;
      }

      if (data.type === "get-leaderboard" && data.requestId) {
        const requestId = data.requestId;
        gameScoreQueries
          .getLeaderboard(gameId, data.numEntries || 10)
          .then(scores => {
            const entries = scores.map(s => ({
              name: s.profiles?.full_name || "Player",
              score: s.score,
              avatarUrl: s.profiles?.avatar_url || undefined,
            }));
            iframeRef.current?.contentWindow?.postMessage(
              { source: "darasaone-host", type: "leaderboard-response", requestId, entries },
              "*"
            );
          })
          .catch(err => {
            console.error("[GamePlayer] failed to fetch leaderboard for game:", err);
            iframeRef.current?.contentWindow?.postMessage(
              { source: "darasaone-host", type: "leaderboard-response", requestId, entries: [] },
              "*"
            );
          });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [game, user]);

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center pt-block">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-accent" aria-hidden="true" />
      </main>
    );
  }

  if (!game) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-stack pt-block text-center">
        <p className="text-ink">{t("pages.GamePlayer.notFound")}</p>
        <Link to="/games" className="inline-flex items-center gap-1 text-accent">
          <ArrowLeft size={16} aria-hidden="true" />
          {t("pages.GamePlayer.backToGames")}
        </Link>
      </main>
    );
  }

  return (
    <>
      <SEOHead titleKey={`${game.title} — Darasaone`} descriptionKey={game.description ?? undefined} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block md:px-gutter-lg">
          <Link to="/games" className="mb-stack inline-flex items-center gap-1 text-sm text-slate hover:text-ink">
            <ArrowLeft size={16} aria-hidden="true" />
            {t("pages.GamePlayer.backToGames")}
          </Link>

          <div className="grid grid-cols-1 gap-block lg:grid-cols-[1fr_320px]">
            <div>
              <h1 className="font-heading text-2xl text-ink md:text-3xl">{game.title}</h1>
              {game.description && <p className="mt-1 text-ink/70">{game.description}</p>}

              {/*
                Different games have different natural shapes: a word
                puzzle wants a tall phone-style frame, a side-scrolling
                runner needs horizontal room to see what's coming. Rather
                than hardcode one shape for every game, this reads
                game.orientation and picks the matching frame — same shape
                at every screen size either way (no per-breakpoint switch;
                that fought the browser's aspect-ratio resolution and
                clipped Ayah Quest earlier), just capped by max-width so
                desktop gets a centered frame instead of stretching.

                While fullscreen, none of that sizing applies — the browser
                is already making this element fill the whole screen, so it
                just needs to actually stretch to that (w-screen h-screen)
                instead of staying pinned to its normal capped box.
              */}
              <div
                ref={frameRef}
                className={
                  isFullscreen
                    ? "relative h-screen w-screen bg-background"
                    : `relative mx-auto mt-stack overflow-hidden rounded-panel border border-hairline shadow-lg ${
                        game.orientation === "landscape" ? "aspect-video w-full max-w-3xl" : "aspect-[9/16] w-full max-w-[420px]"
                      }`
                }
              >
                {!iframeLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-accent" aria-hidden="true" />
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  src={game.file_url}
                  title={game.title}
                  className="h-full w-full border-0"
                  onLoad={() => setIframeLoaded(true)}
                  allow="autoplay"
                />
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={t(isFullscreen ? "pages.GamePlayer.exitFullscreen" : "pages.GamePlayer.enterFullscreen")}
                  className="absolute right-2 top-2 rounded-control bg-ink/60 p-1.5 text-ink-foreground transition-colors duration-base hover:bg-ink/80"
                >
                  {isFullscreen ? <Minimize size={16} aria-hidden="true" /> : <Maximize size={16} aria-hidden="true" />}
                </button>
              </div>
              {!user && <p className="mt-2 text-xs text-slate">{t("pages.GamePlayer.signInToSave")}</p>}
            </div>

            <Leaderboard gameId={game.id} />
          </div>
        </section>
      </main>
    </>
  );
}
