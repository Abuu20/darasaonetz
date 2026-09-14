import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import images from "@/assets/images.json";

const FOOTER_LINKS = [
  { id: "courses", to: "/courses", labelKey: "components.layout.Footer.navCourses" },
  { id: "about", to: "/about", labelKey: "components.layout.Footer.navAbout" },
  { id: "teach", to: "/about#teach", labelKey: "components.layout.Footer.navTeach" },
  { id: "contact", to: "/contact", labelKey: "components.layout.Footer.navContact" },
  { id: "account", to: "/account", labelKey: "components.layout.Footer.navAccount" },
] as const;

export default function Footer() {
  const { t } = useLanguage();
  const contactEmail = import.meta.env.VITE_WEBSITE_CONTACT_EMAIL as string | undefined;

  return (
    <footer className="bg-night px-gutter pb-block pt-block text-night-foreground md:px-gutter-lg">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <div className="flex flex-col gap-block md:flex-row md:items-start md:justify-between">
          <div className="flex max-w-prose flex-col gap-tight">
            <Link to="/" className="flex items-center gap-tight">
              <img src={images["logo"]} data-image-id="logo" alt={t("components.layout.Footer.logoAlt")} className="h-8 w-8" />
              <span data-text-id="components.layout.Footer.brand" className="font-heading text-lg text-night-foreground">
                {t("components.layout.Footer.brand")}
              </span>
            </Link>
            <p data-text-id="components.layout.Footer.blurb" className="text-sm text-lilac">
              {t("components.layout.Footer.blurb")}
            </p>
            {contactEmail ? (
              <a
                href={`mailto:${contactEmail}`}
                className="inline-flex items-center gap-tight text-sm text-night-foreground transition-opacity duration-base hover:opacity-80"
              >
                <Mail size={16} aria-hidden="true" />
                <span>{contactEmail}</span>
              </a>
            ) : null}
          </div>

          <nav className="flex flex-col gap-tight" aria-label={t("components.layout.Footer.navLabel")}>
            {FOOTER_LINKS.map(item => (
              <Link
                key={item.id}
                to={item.to}
                className="text-sm text-lilac transition-colors duration-base hover:text-night-foreground"
              >
                <span data-text-id={item.labelKey}>{t(item.labelKey)}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col items-start justify-between gap-tight border-t border-hairline pt-stack md:flex-row md:items-center">
          <p className="text-xs text-lavender">
            <span>&copy; {new Date().getFullYear()} </span>
            <span data-text-id="components.layout.Footer.rights">{t("components.layout.Footer.rights")}</span>
          </p>
          <LanguageSwitcher tone="dark" />
        </div>
      </div>
    </footer>
  );
}
