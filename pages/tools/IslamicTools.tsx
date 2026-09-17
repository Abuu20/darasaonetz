import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Search } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import ToolCard from "@/components/tools/ToolCard";
import IslamicPatternBg from "@/components/tools/IslamicPatternBg";

type Category = "all" | "quran" | "prayer" | "ramadan" | "learning";

export default function IslamicTools() {
  const { t } = useLanguage();
  const [category, setCategory] = useState<Category>("all");
  const [query, setQuery] = useState("");

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
      category: "quran" as Category,
      title: t("pages.tools.IslamicTools.quran.title"),
      description: t("pages.tools.IslamicTools.quran.description"),
      tags: [t("pages.tools.IslamicTools.quran.tag1"), t("pages.tools.IslamicTools.quran.tag2")],
    },
    {
      to: "/tools/prayer-times",
      emoji: "/icons/tools/prayer-times.png",
      gradientClassName: "gradient-head",
      category: "prayer" as Category,
      title: t("pages.tools.IslamicTools.prayerTimes.title"),
      description: t("pages.tools.IslamicTools.prayerTimes.description"),
      tags: [t("pages.tools.IslamicTools.prayerTimes.tag1"), t("pages.tools.IslamicTools.prayerTimes.tag2")],
    },
    {
      to: "/tools/qibla",
      emoji: "/icons/tools/qibla.png",
      gradientClassName: "gradient-brand",
      category: "prayer" as Category,
      title: t("pages.tools.IslamicTools.qibla.title"),
      description: t("pages.tools.IslamicTools.qibla.description"),
      tags: [t("pages.tools.IslamicTools.qibla.tag1"), t("pages.tools.IslamicTools.qibla.tag2")],
    },
    {
      to: "/tools/tasbih",
      emoji: "/icons/tools/tasbih.png",
      gradientClassName: "gradient-head",
      category: "prayer" as Category,
      title: t("pages.tools.IslamicTools.tasbih.title"),
      description: t("pages.tools.IslamicTools.tasbih.description"),
      tags: [t("pages.tools.IslamicTools.tasbih.tag1"), t("pages.tools.IslamicTools.tasbih.tag2")],
    },
    {
      to: "/tools/ramadan",
      emoji: "/icons/tools/ramadan.png",
      gradientClassName: "gradient-brand",
      category: "ramadan" as Category,
      title: t("pages.tools.IslamicTools.ramadan.title"),
      description: t("pages.tools.IslamicTools.ramadan.description"),
      tags: [t("pages.tools.IslamicTools.ramadan.tag1"), t("pages.tools.IslamicTools.ramadan.tag2")],
    },
    {
      to: "https://abuu20.github.io/pathway-to-arabic/",
      emoji: "/icons/tools/arabic-learning.png",
      gradientClassName: "gradient-head",
      category: "learning" as Category,
      title: t("pages.tools.IslamicTools.arabic.title"),
      description: t("pages.tools.IslamicTools.arabic.description"),
      tags: [t("pages.tools.IslamicTools.arabic.tag1"), t("pages.tools.IslamicTools.arabic.tag2")],
    },
    {
      to: "https://abuu20.github.io/hadiths/",
      emoji: "/icons/tools/quran.png",
      gradientClassName: "gradient-brand",
      category: "learning" as Category,
      title: t("pages.tools.IslamicTools.hadiths.title"),
      description: t("pages.tools.IslamicTools.hadiths.description"),
      tags: [t("pages.tools.IslamicTools.hadiths.tag1"), t("pages.tools.IslamicTools.hadiths.tag2")],
    },
  ] as const;

  const categories: { id: Category; labelKey: string }[] = [
    { id: "all", labelKey: "pages.tools.IslamicTools.categories.all" },
    { id: "quran", labelKey: "pages.tools.IslamicTools.categories.quran" },
    { id: "prayer", labelKey: "pages.tools.IslamicTools.categories.prayer" },
    { id: "ramadan", labelKey: "pages.tools.IslamicTools.categories.ramadan" },
    { id: "learning", labelKey: "pages.tools.IslamicTools.categories.learning" },
  ];

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tools.filter(tool => {
      const matchesCategory = category === "all" || tool.category === category;
      const haystack = `${tool.title} ${tool.description} ${tool.tags.join(" ")}`.toLowerCase();
      return matchesCategory && (needle.length === 0 || haystack.includes(needle));
    });
  }, [tools, category, query]);

  return (
    <>
      <SEOHead titleKey={t("pages.tools.IslamicTools.seo.title")} descriptionKey={t("pages.tools.IslamicTools.seo.description")} />
      <main className="pt-block">
        <section className="relative mx-auto max-w-shell overflow-hidden px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <IslamicPatternBg className="text-accent/[0.12]" />
          <div className="relative">
            <span data-text-id="pages.tools.IslamicTools.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
              {t("pages.tools.IslamicTools.eyebrow")}
            </span>
            <h1 data-text-id="pages.tools.IslamicTools.title" className="mt-2 font-heading text-3xl text-ink md:text-5xl">
              {t("pages.tools.IslamicTools.title")}
            </h1>
            <p data-text-id="pages.tools.IslamicTools.paragraph" className="mx-auto mt-3 max-w-prose text-ink/70 md:text-lg">
              {t("pages.tools.IslamicTools.paragraph")}
            </p>
          </div>
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto flex max-w-shell flex-col gap-block">
            <div className="flex flex-col gap-stack lg:flex-row lg:items-center lg:justify-between">
              <div className="flex w-full items-center gap-tight rounded-pill border border-line px-stack py-tight lg:max-w-xs">
                <Search size={18} className="text-slate" aria-hidden="true" />
                <label className="sr-only" htmlFor="tools-search">
                  <span data-text-id="pages.tools.IslamicTools.searchLabel">{t("pages.tools.IslamicTools.searchLabel")}</span>
                </label>
                <input
                  id="tools-search"
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={t("pages.tools.IslamicTools.searchPlaceholder")}
                  className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-slate"
                />
              </div>

              <div className="flex flex-wrap gap-tight" role="group" aria-label={t("pages.tools.IslamicTools.filterLabel")}>
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    aria-pressed={category === cat.id}
                    className={`rounded-pill border px-stack py-tight text-sm transition-all duration-base ${
                      category === cat.id ? "border-transparent bg-ink text-ink-foreground" : "border-line text-slate hover:border-accent hover:text-ink"
                    }`}
                  >
                    {t(cat.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="flex flex-col items-center gap-tight rounded-card bg-mist px-block py-block text-center">
                <Search size={22} className="text-slate" aria-hidden="true" />
                <p data-text-id="pages.tools.IslamicTools.empty" className="text-sm text-slate">
                  {t("pages.tools.IslamicTools.empty")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-stack sm:grid-cols-2 lg:grid-cols-4">
                {visible.map((tool, index) => (
                  <motion.div
                    key={tool.to}
                    initial={{ opacity: 0.001, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.5, delay: (index % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <ToolCard
                      to={tool.to}
                      emoji={tool.emoji}
                      gradientClassName={tool.gradientClassName}
                      title={tool.title}
                      description={tool.description}
                      tags={tool.tags}
                      openLabel={t("pages.tools.IslamicTools.openTool")}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
          <p className="mx-auto mt-block max-w-prose text-center text-xs text-slate">
            {t("pages.tools.IslamicTools.attribution")}
          </p>
        </section>
      </main>
    </>
  );
}
