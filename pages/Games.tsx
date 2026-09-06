import { Link } from "react-router-dom";
import { Trophy } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import GameGrid from "@/components/Games/GameGrid";

export default function Games() {
  const { t } = useLanguage();

  return (
    <>
      <SEOHead titleKey={t("pages.Games.seo.title")} descriptionKey={t("pages.Games.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.Games.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {t("pages.Games.eyebrow")}
          </span>
          <h1 data-text-id="pages.Games.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {t("pages.Games.title")}
          </h1>
          <p data-text-id="pages.Games.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {t("pages.Games.paragraph")}
          </p>
          <Link to="/leaderboard" className="mt-3 inline-flex items-center gap-1 text-sm text-accent hover:underline">
            <Trophy size={14} aria-hidden="true" />
            {t("pages.Games.viewLeaderboard")}
          </Link>
        </section>

        <GameGrid />
      </main>
    </>
  );
}
