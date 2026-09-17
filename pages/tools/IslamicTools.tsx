import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import ToolCard from "@/components/tools/ToolCard";
import IslamicPatternBg from "@/components/tools/IslamicPatternBg";

// Self-contained SVG icons for the two newest tools, encoded as data URIs.
// Unlike the bundled PNGs in /public/icons/tools (which depend on that exact
// file existing in the deployed repo), these are generated at runtime from
// the string right here — nothing to forget to commit, nothing that can 404.
const svgIcon = (svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`;

const arabicIcon = svgIcon(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FE881B"/>
      <stop offset="100%" stop-color="#C86FFF"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#g)"/>
  <path d="M16 22c6-4 12-4 16 0v22c-4-4-10-4-16 0V22z" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
  <path d="M48 22c-6-4-12-4-16 0v22c4-4 10-4 16 0V22z" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round"/>
</svg>
`);

const hadithsIcon = svgIcon(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g2" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2BA7FF"/>
      <stop offset="100%" stop-color="#1C4EFF"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#g2)"/>
  <rect x="17" y="19" width="30" height="26" rx="3" fill="none" stroke="#fff" stroke-width="2.5"/>
  <circle cx="17" cy="19" r="4" fill="#fff"/>
  <circle cx="47" cy="45" r="4" fill="#fff"/>
  <line x1="23" y1="27" x2="41" y2="27" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <line x1="23" y1="33" x2="41" y2="33" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
  <line x1="23" y1="39" x2="35" y2="39" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
</svg>
`);

export default function IslamicTools() {
  const { t } = useLanguage();

  // 3D Islamic emoji, bundled locally at /public/icons/tools (Microsoft's
  // open-source Fluent Emoji 3D set — see that folder's README for
  // licensing) — one clear, literal match per tool rather than a generic
  // icon: an open book for reading, a mosque for prayer, a compass for
  // qibla direction, prayer beads for tasbih, a crescent moon for Ramadan.
  const tools = [
    {
      to: "/tools/quran",
      emoji: "/icons/tools/quran.png",
      gradientClassName: "gradient-brand",
      title: t("pages.tools.IslamicTools.quran.title"),
      description: t("pages.tools.IslamicTools.quran.description"),
    },
    {
      to: "/tools/prayer-times",
      emoji: "/icons/tools/prayer-times.png",
      gradientClassName: "gradient-head",
      title: t("pages.tools.IslamicTools.prayerTimes.title"),
      description: t("pages.tools.IslamicTools.prayerTimes.description"),
    },
    {
      to: "/tools/qibla",
      emoji: "/icons/tools/qibla.png",
      gradientClassName: "gradient-brand",
      title: t("pages.tools.IslamicTools.qibla.title"),
      description: t("pages.tools.IslamicTools.qibla.description"),
    },
    {
      to: "/tools/tasbih",
      emoji: "/icons/tools/tasbih.png",
      gradientClassName: "gradient-head",
      title: t("pages.tools.IslamicTools.tasbih.title"),
      description: t("pages.tools.IslamicTools.tasbih.description"),
    },
    {
      to: "/tools/ramadan",
      emoji: "/icons/tools/ramadan.png",
      gradientClassName: "gradient-brand",
      title: t("pages.tools.IslamicTools.ramadan.title"),
      description: t("pages.tools.IslamicTools.ramadan.description"),
    },
    {
      to: "https://abuu20.github.io/pathway-to-arabic/",
      emoji: arabicIcon,
      gradientClassName: "gradient-head",
      title: "Learn Arabic",
      description: "A self-study pathway to classical and Quranic Arabic, from your first letters to reading unaided.",
    },
    {
      to: "https://abuu20.github.io/hadiths/",
      emoji: hadithsIcon,
      gradientClassName: "gradient-brand",
      title: "Hadiths",
      description: "Search and read hadiths in multiple languages and grades, from all the major collections.",
    },
  ] as const;

  return (
    <>
      <SEOHead titleKey={t("pages.tools.IslamicTools.seo.title")} descriptionKey={t("pages.tools.IslamicTools.seo.description")} />
      <main className="pt-block">
        {/* Hero */}
        <section className="relative overflow-hidden bg-background">
          {/* Aurora glow: three large, blurred, slow-breathing color blobs in
              the site's own brand palette — this is what gives the hero
              depth and warmth without needing a stock photo (which would
              also risk licensing issues). Pure CSS, no image asset. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
          >
            <div className="absolute -left-32 -top-40 h-[28rem] w-[28rem] animate-pulse rounded-full bg-primary/30 blur-[110px] duration-[6s]" />
            <div className="absolute -right-24 top-10 h-[24rem] w-[24rem] animate-pulse rounded-full bg-accent/30 blur-[110px] duration-[7s]" />
            <div className="absolute bottom-[-8rem] left-1/3 h-[22rem] w-[22rem] animate-pulse rounded-full bg-ember/20 blur-[110px] duration-[8s]" />
          </div>

          <IslamicPatternBg />

          <div className="relative mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
            {/* Crescent + star mark — a distinct Islamic identity element,
                not just a generic tech-company badge. */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              className="mx-auto mb-4"
              aria-hidden="true"
            >
              <path
                d="M22 6a14 14 0 1 0 0 28 11 11 0 1 1 0-28z"
                fill="none"
                stroke="#C86FFF"
                strokeWidth="2"
              />
              <path
                d="M29 8l1.1 2.4L32.5 11.5l-2.4 1.1L29 15l-1.1-2.4-2.4-1.1 2.4-1.1z"
                fill="#FE881B"
              />
            </svg>

            <span
              data-text-id="pages.tools.IslamicTools.eyebrow"
              className="inline-flex items-center gap-2 rounded-pill border border-line bg-mist px-4 py-1.5 text-sm uppercase tracking-widest text-gradient-head"
            >
              {t("pages.tools.IslamicTools.eyebrow")}
            </span>
            <h1
              data-text-id="pages.tools.IslamicTools.title"
              className="mt-5 font-heading text-4xl leading-tight text-ink md:text-7xl"
            >
              {t("pages.tools.IslamicTools.title")}
            </h1>
            <p
              data-text-id="pages.tools.IslamicTools.paragraph"
              className="mx-auto mt-4 max-w-prose text-lg text-ink/70"
            >
              {t("pages.tools.IslamicTools.paragraph")}
            </p>

            <div className="mx-auto mt-8 flex max-w-xs flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              <a
                href="#tools-grid"
                className="card-lift gradient-brand rounded-pill px-7 py-3 text-sm font-medium text-primary-foreground transition-transform duration-base hover:scale-hover active:scale-active"
              >
                Browse all tools
              </a>
              <a
                href="/tools"
                className="rounded-pill border border-line px-7 py-3 text-sm font-medium text-ink transition-colors duration-base hover:bg-mist"
              >
                Back to all categories
              </a>
            </div>
          </div>
        </section>

        {/* Tool grid */}
        <section id="tools-grid" className="scroll-mt-block bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto grid max-w-shell grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-4">
            {tools.map(tool => (
              <ToolCard
                key={tool.to}
                to={tool.to}
                emoji={tool.emoji}
                gradientClassName={tool.gradientClassName}
                title={tool.title}
                description={tool.description}
              />
            ))}
          </div>
          <p className="mx-auto mt-block max-w-prose text-center text-xs text-slate">
            {t("pages.tools.IslamicTools.attribution")}
          </p>
        </section>
      </main>
    </>
  );
}
