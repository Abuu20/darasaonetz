import { motion } from "motion/react";
import { useLanguage } from "@/context/LanguageContext";
import { openAuthModal } from "@/lib/authModalBus";
import images from "@/assets/images.json";

const fadeUp = {
  initial: { opacity: 0.001, y: 24, filter: "blur(8px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.3 },
} as const;

export default function TeacherVoice() {
  const { t } = useLanguage();

  return (
    <section id="teach" className="bg-mist px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto grid max-w-shell grid-cols-1 items-center gap-block md:grid-cols-[3fr_2fr]">
        <div>
          <motion.h2
            {...fadeUp}
            transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
            data-text-id="components.About.TeacherVoice.heading"
            className="mb-block font-heading text-2xl leading-snug text-ink sm:text-3xl"
          >
            {t("components.About.TeacherVoice.heading")}
          </motion.h2>

          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }} className="mb-stack flex items-center gap-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-control bg-ink text-xs text-ink-foreground">D</span>
            <span data-text-id="components.About.TeacherVoice.org" className="text-sm text-ink">
              {t("components.About.TeacherVoice.org")}
            </span>
          </motion.div>

          <motion.blockquote
            {...fadeUp}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            data-text-id="components.About.TeacherVoice.quote"
            className="mb-stack text-lg leading-relaxed text-slate sm:text-xl md:text-2xl"
          >
            {t("components.About.TeacherVoice.quote")}
          </motion.blockquote>

          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.1, 0.25, 1] }} className="mb-block">
            <p data-text-id="components.About.TeacherVoice.person" className="text-sm text-ink">
              {t("components.About.TeacherVoice.person")}
            </p>
            <p data-text-id="components.About.TeacherVoice.role" className="text-xs text-slate">
              {t("components.About.TeacherVoice.role")}
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.4, ease: [0.25, 0.1, 0.25, 1] }}>
            <button
              type="button"
              onClick={() => openAuthModal({ mode: "signup", role: "teacher" })}
              className="inline-flex items-center gap-tight rounded-control bg-ink px-stack py-tight text-sm text-ink-foreground transition-all duration-base hover:scale-hover active:scale-active"
            >
              <span data-text-id="components.About.TeacherVoice.cta">{t("components.About.TeacherVoice.cta")}</span>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </motion.div>
        </div>

        <motion.div {...fadeUp} transition={{ duration: 0.7, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }} className="flex justify-center md:justify-end">
          <img
            src={images["about.testimonial"]}
            data-image-id="about.testimonial"
            alt={t("components.About.TeacherVoice.mediaAlt")}
            className="aspect-square w-full max-w-sm rounded-card object-cover"
          />
        </motion.div>
      </div>
    </section>
  );
}
