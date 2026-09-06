import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Gamepad2, Search, Trophy } from "lucide-react";
import { gameQueries } from "@/lib/db/games";
import type { Game } from "@/lib/db/types";
import { useLanguage } from "@/context/LanguageContext";

// Same shape as CourseGrid: fetch everything published, filter client-side.
// Fine at dozens-to-low-hundreds of rows. Once the catalog is genuinely in
// the hundreds, swap gameQueries.getPublished() for a paginated/infinite-
// scroll query (category + search become server-side filters) — the search
// box and category chips below don't need to change, only where `games`
// comes from.
export default function GameGrid() {
  const { t } = useLanguage();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    gameQueries
      .getPublished()
      .then(setGames)
      .catch(() => setGames([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(games.map(game => game.category))).sort();
  }, [games]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return games.filter(game => {
      const matchesCategory = category === "all" || game.category === category;
      const haystack = `${game.title} ${game.description ?? ""}`.toLowerCase();
      return matchesCategory && (needle.length === 0 || haystack.includes(needle));
    });
  }, [games, category, query]);

  return (
    <section id="game-catalog" className="bg-background px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <div className="flex flex-col gap-stack lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-1 items-center gap-tight rounded-pill border border-line px-stack py-tight">
            <Search size={18} className="text-slate" aria-hidden="true" />
            <label className="sr-only" htmlFor="game-search">
              <span data-text-id="components.Games.GameGrid.searchLabel">{t("components.Games.GameGrid.searchLabel")}</span>
            </label>
            <input
              id="game-search"
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder={t("components.Games.GameGrid.searchPlaceholder")}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
            />
          </div>

          <div className="flex flex-wrap gap-tight" role="group" aria-label={t("components.Games.GameGrid.filterLabel")}>
            <button
              type="button"
              onClick={() => setCategory("all")}
              aria-pressed={category === "all"}
              className={`rounded-pill border px-stack py-tight text-sm transition-all duration-base ${
                category === "all" ? "border-transparent bg-ink text-ink-foreground" : "border-line text-slate hover:border-accent hover:text-ink"
              }`}
            >
              <span data-text-id="components.Games.GameGrid.categoryAll">{t("components.Games.GameGrid.categoryAll")}</span>
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                aria-pressed={category === cat}
                className={`rounded-pill border px-stack py-tight text-sm transition-all duration-base ${
                  category === cat ? "border-transparent bg-ink text-ink-foreground" : "border-line text-slate hover:border-accent hover:text-ink"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-stack sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(index => (
              <div key={index} className="aspect-[3/4] animate-pulse rounded-card bg-mist" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-stack rounded-card bg-mist px-block py-block text-center">
            <Gamepad2 size={40} className="text-slate" aria-hidden="true" />
            <p data-text-id="components.Games.GameGrid.empty" className="text-sm text-slate">
              {t("components.Games.GameGrid.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-stack sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {visible.map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0.001, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: (index % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              >
                <Link
                  to={`/games/${game.slug}`}
                  className="card-lift group flex flex-col overflow-hidden rounded-card bg-background"
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-mist">
                    {game.thumbnail_url ? (
                      <img
                        src={game.thumbnail_url}
                        alt={game.title}
                        className="h-full w-full object-cover transition-transform duration-slow group-hover:scale-hover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent/20 to-ink/10">
                        <Gamepad2 size={36} className="text-accent" aria-hidden="true" />
                      </div>
                    )}
                    <span className="absolute left-2 top-2 rounded-pill bg-ink/80 px-tight py-0.5 text-[11px] uppercase tracking-widest text-ink-foreground">
                      {game.category}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-1 px-tight py-stack">
                    <h3 className="line-clamp-2 font-heading text-sm text-ink transition-colors duration-base group-hover:text-accent">
                      {game.title}
                    </h3>
                    <div className="mt-auto flex items-center justify-between text-xs text-slate">
                      <span>{game.difficulty}</span>
                      <span className="inline-flex items-center gap-1">
                        <Trophy size={12} aria-hidden="true" />
                        {game.points_per_win}
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
