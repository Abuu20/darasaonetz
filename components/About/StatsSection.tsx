import { useEffect, useRef } from "react";
import { animate, motion, useInView } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

const STATS = [
  { id: "students", value: 12000, suffix: "+", labelKey: "components.About.StatsSection.students" },
  { id: "completion", value: 94.2, decimals: 1, suffix: "%", labelKey: "components.About.StatsSection.completion" },
  { id: "teachers", value: 180, suffix: "+", labelKey: "components.About.StatsSection.teachers" },
  { id: "materials", value: 2400, suffix: "+", labelKey: "components.About.StatsSection.materials" },
  { id: "languages", value: 2, suffix: "", labelKey: "components.About.StatsSection.languages" },
] as const;

function AnimatedCounter({ value, suffix = "", decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView || !ref.current) return;
    const node = ref.current;
    const controls = animate(0, value, {
      duration: 1.5,
      ease: "easeOut",
      onUpdate(latest) {
        node.textContent = `${latest.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, value, suffix, decimals]);

  return <span ref={ref}>{`0${suffix}`}</span>;
}

export default function StatsSection() {
  const { t } = useLanguage();

  return (
    <section className="w-full border-t border-hairline bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto flex max-w-shell flex-col gap-block lg:flex-row lg:items-stretch lg:gap-block">
        <motion.div
          initial={{ opacity: 0.001 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="flex flex-1 flex-col justify-start"
        >
          <h2 className="mb-stack font-heading leading-tight" style={{ fontSize: "clamp(24px, 3.4vw, 48px)" }}>
            <span data-text-id="components.About.StatsSection.headingA">{t("components.About.StatsSection.headingA")}</span>
            <br />
            <span data-text-id="components.About.StatsSection.headingB" className="text-gradient-head">
              {t("components.About.StatsSection.headingB")}
            </span>
          </h2>
          <p data-text-id="components.About.StatsSection.paragraph" className="mb-block max-w-prose text-base text-lavender md:text-lg">
            {t("components.About.StatsSection.paragraph")}
          </p>

          <div className="grid grid-cols-2 gap-block md:grid-cols-3">
            {STATS.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0.001, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.5, delay: index * 0.06, ease: "easeOut" }}
                className="flex flex-col"
              >
                <span className="mb-tight font-heading text-4xl md:text-5xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} decimals={(stat as any).decimals ?? 0} />
                </span>
                <span data-text-id={stat.labelKey} className="text-xs uppercase tracking-widest text-lavender">
                  {t(stat.labelKey)}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0.001, scale: 0.94 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex shrink-0 items-center justify-center lg:w-2/5"
        >
          <img
            src={images["about.stats"]}
            data-image-id="about.stats"
            alt={t("components.About.StatsSection.mediaAlt")}
            className="aspect-square w-full max-w-md rounded-card object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
