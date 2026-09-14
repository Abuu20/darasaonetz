import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";
import videos from "@/assets/videos.json";

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-gutter">
      <video
        src={videos["hero.background"]}
        data-video-id="hero.background"
        poster={images["hero.poster"]}
        muted
        loop
        autoPlay
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-night/55" />
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-48 bg-gradient-to-b from-transparent to-night" />

      <motion.div
        initial={{ opacity: 0.001, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex max-w-2xl flex-col items-center gap-stack text-center"
      >
        <span data-text-id="components.Home.Hero.eyebrow" className="text-gradient-head text-lg">
          {t("components.Home.Hero.eyebrow")}
        </span>
        <h1
          data-text-id="components.Home.Hero.title"
          className="font-heading leading-tight text-night-foreground"
          style={{ fontSize: "clamp(32px, 4vw, 56px)" }}
        >
          {t("components.Home.Hero.title")}
        </h1>
        <p
          data-text-id="components.Home.Hero.paragraph"
          className="text-lavender"
          style={{ fontSize: "clamp(15px, 1.2vw, 20px)" }}
        >
          {t("components.Home.Hero.paragraph")}
        </p>
        <div className="flex flex-col gap-tight sm:flex-row">
          <Link
            to="/courses"
            className="gradient-brand rounded-control px-block py-tight text-sm text-primary-foreground transition-all duration-base hover:scale-hover active:scale-active"
          >
            <span data-text-id="components.Home.Hero.ctaPrimary">{t("components.Home.Hero.ctaPrimary")}</span>
          </Link>
          <Link
            to="/about#teach"
            className="rounded-control border border-lavender/40 px-block py-tight text-sm text-night-foreground transition-all duration-base hover:border-accent hover:scale-hover active:scale-active"
          >
            <span data-text-id="components.Home.Hero.ctaSecondary">{t("components.Home.Hero.ctaSecondary")}</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
