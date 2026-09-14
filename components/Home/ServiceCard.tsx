import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import images from "@/assets/images.json";

export default function ServiceCard({
  labelKey,
  titleKey,
  bulletKeys,
  dots,
}: {
  labelKey: string;
  titleKey: string;
  bulletKeys: readonly string[];
  dots: number;
}) {
  const { t } = useLanguage();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="glass-panel relative flex cursor-pointer flex-col overflow-hidden rounded-card"
      style={{ height: "clamp(320px, 32vw, 500px)" }}
    >
      <div
        className="absolute left-0 right-0 top-0 z-[1] transition-all duration-slow"
        style={{
          height: "55%",
          transform: hovered ? "translateY(0)" : "translateY(-30%)",
          opacity: hovered ? 1 : 0.7,
        }}
      >
        <img
          src={images["trusted.card"]}
          data-image-id="trusted.card"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-top"
        />
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 z-[1] bg-gradient-to-t from-night/95 to-transparent transition-all duration-slow"
        style={{
          height: "55%",
          transform: hovered ? "translateY(0)" : "translateY(100%)",
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="relative z-[2] flex h-full flex-col px-stack py-stack md:px-block">
        <span className="inline-flex w-fit items-center gap-tight rounded-pill bg-hairline px-stack py-1.5 text-xs text-panel-foreground">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="var(--color-accent)" strokeWidth="1.2" />
            {dots > 0 ? <circle cx="8" cy="8" r={1 + dots} fill="var(--color-accent)" /> : null}
          </svg>
          <span data-text-id={labelKey}>{t(labelKey)}</span>
        </span>

        <div className="flex-grow" />

        <h3
          data-text-id={titleKey}
          className="font-heading leading-snug text-panel-foreground transition-transform duration-slow"
          style={{ fontSize: "clamp(16px, 1.7vw, 24px)", transform: hovered ? "translateY(-8px)" : "translateY(0)" }}
        >
          {t(titleKey)}
        </h3>

        <ul className="mt-stack flex flex-col gap-tight">
          {bulletKeys.map(key => (
            <li
              key={key}
              className="bg-left bg-no-repeat pl-7 text-xs text-lilac"
              style={{ backgroundImage: `url(${images["icons.check"]})`, backgroundSize: "18px" }}
            >
              <span data-text-id={key}>{t(key)}</span>
            </li>
          ))}
        </ul>

        <Link
          to="/courses"
          className="gradient-brand mt-stack block overflow-hidden rounded-control text-center text-sm text-primary-foreground transition-all duration-slow"
          style={{
            maxHeight: hovered ? "80px" : "0px",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(20px)",
            paddingTop: hovered ? "0.7rem" : 0,
            paddingBottom: hovered ? "0.7rem" : 0,
          }}
          tabIndex={hovered ? 0 : -1}
          aria-hidden={!hovered}
        >
          <span data-text-id="components.Home.ServiceCard.cta">{t("components.Home.ServiceCard.cta")}</span>
        </Link>
      </div>
    </div>
  );
}
