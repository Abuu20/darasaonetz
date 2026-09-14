import { RotateCcw } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import { useToolProgress } from "@/lib/hooks/useToolProgress";

const TARGETS = [33, 99, 100, 1000] as const;
// Superseded by the "darasaone.tasbih.progress" key below (which also holds
// the chosen target and syncs across devices when signed in) — read once as
// a seed so anyone with an existing count doesn't see it reset to zero.
const LEGACY_STORAGE_KEY = "darasaone.tasbih.count";

interface TasbihProgress {
  count: number;
  target: number;
}

function legacySeed(): TasbihProgress {
  if (typeof window === "undefined") return { count: 0, target: 33 };
  try {
    const raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
    return { count: raw ? Number(raw) || 0 : 0, target: 33 };
  } catch {
    return { count: 0, target: 33 };
  }
}

export default function Tasbih() {
  const { t } = useLanguage();
  const [progress, setProgress] = useToolProgress<TasbihProgress>("tasbih", "darasaone.tasbih.progress", legacySeed());
  const { count, target } = progress;

  const persist = (value: number) => {
    setProgress({ count: value, target });
  };

  const setTarget = (value: number) => {
    setProgress({ count, target: value });
  };

  const increment = () => {
    const next = count + 1;
    persist(next);
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(next % target === 0 ? [20, 40, 20] : 12);
    }
  };

  const reset = () => persist(0);

  const progressPct = Math.min(100, ((count % target || (count > 0 ? target : 0)) / target) * 100);
  const cycles = Math.floor(count / target);

  return (
    <>
      <SEOHead titleKey={t("pages.tools.Tasbih.seo.title")} descriptionKey={t("pages.tools.Tasbih.seo.description")} />
      <main className="pt-block">
        <section className="mx-auto max-w-shell px-gutter pb-block pt-section-spacing-mobile text-center md:px-gutter-lg md:pt-section-spacing">
          <span data-text-id="pages.tools.Tasbih.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
            {t("pages.tools.Tasbih.eyebrow")}
          </span>
          <h1 data-text-id="pages.tools.Tasbih.title" className="mt-2 font-heading text-3xl text-ink md:text-4xl">
            {t("pages.tools.Tasbih.title")}
          </h1>
          <p data-text-id="pages.tools.Tasbih.paragraph" className="mx-auto mt-2 max-w-prose text-ink/70">
            {t("pages.tools.Tasbih.paragraph")}
          </p>
        </section>

        <section className="bg-background px-gutter pb-section-spacing-mobile md:px-gutter-lg md:pb-section-spacing">
          <div className="mx-auto flex max-w-sm flex-col items-center gap-block">
            <div className="flex items-center gap-tight text-xs text-slate">
              {TARGETS.map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTarget(value)}
                  aria-pressed={target === value}
                  className={`rounded-pill border px-stack py-1 transition-all duration-base ${
                    target === value ? "border-transparent bg-ink text-ink-foreground" : "border-line text-slate hover:border-accent hover:text-ink"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={increment}
              className="gradient-brand relative flex h-56 w-56 items-center justify-center rounded-pill text-primary-foreground shadow-lg transition-transform duration-fast active:scale-active"
              style={{
                backgroundImage: `conic-gradient(rgba(255,255,255,0.35) ${progressPct}%, transparent ${progressPct}%), linear-gradient(90deg, #1C4EFF, #AC24FF 50%, #FE881B)`,
              }}
            >
              <span className="flex flex-col items-center">
                <span className="font-heading text-5xl">{count % target === 0 && count > 0 ? target : count % target}</span>
                <span className="text-xs uppercase tracking-widest opacity-80">{t("pages.tools.Tasbih.tapToCount")}</span>
              </span>
            </button>

            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-sm text-ink">
                {t("pages.tools.Tasbih.total")}: {count}
              </span>
              {cycles > 0 ? (
                <span className="text-xs text-slate">
                  {cycles} × {target} {t("pages.tools.Tasbih.completed")}
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-tight rounded-control border border-line px-stack py-tight text-sm text-ink transition-colors duration-base hover:border-accent hover:text-accent"
            >
              <RotateCcw size={14} aria-hidden="true" />
              {t("pages.tools.Tasbih.reset")}
            </button>
          </div>
        </section>
      </main>
    </>
  );
}
