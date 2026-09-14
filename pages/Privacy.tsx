import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";

// Section keys are pulled from assets/locales/<lang>/pages/Privacy.json.
// Each section is a heading + one or more paragraphs. Keep this list in
// sync with the locale files if a section is ever added or removed.
const SECTIONS = [
  "intro",
  "infoWeCollect",
  "howWeUse",
  "cookiesStorage",
  "thirdParties",
  "dataRetention",
  "yourRights",
  "childrenPrivacy",
  "security",
  "internationalTransfers",
  "changes",
  "contact",
] as const;

export default function Privacy() {
  const { t } = useLanguage();
  const contactEmail = import.meta.env.VITE_WEBSITE_CONTACT_EMAIL as string | undefined;
  const updated = t("pages.Privacy.lastUpdated");

  return (
    <>
      <SEOHead titleKey={t("pages.Privacy.seo.title")} descriptionKey={t("pages.Privacy.seo.description")} />
      <main className="bg-background px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
        <div className="mx-auto flex max-w-prose flex-col gap-block">
          <div className="flex flex-col gap-tight">
            <span data-text-id="pages.Privacy.eyebrow" className="text-sm uppercase tracking-widest text-slate">
              {t("pages.Privacy.eyebrow")}
            </span>
            <h1
              data-text-id="pages.Privacy.title"
              className="font-heading leading-tight text-ink"
              style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
            >
              {t("pages.Privacy.title")}
            </h1>
            <p data-text-id="pages.Privacy.lastUpdated" className="text-sm text-slate">
              {updated}
            </p>
          </div>

          <div className="flex flex-col gap-stack">
            {SECTIONS.map(section => {
              const headingKey = `pages.Privacy.${section}.heading`;
              const bodyKey = `pages.Privacy.${section}.body`;
              const heading = t(headingKey);
              const body = t(bodyKey);
              return (
                <section key={section} className="flex flex-col gap-tight border-t border-hairline pt-stack first:border-t-0 first:pt-0">
                  <h2 data-text-id={headingKey} className="font-heading text-xl text-ink">
                    {heading}
                  </h2>
                  <p data-text-id={bodyKey} className="whitespace-pre-line text-base leading-relaxed text-slate">
                    {body.replace("{email}", contactEmail ?? "")}
                  </p>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
