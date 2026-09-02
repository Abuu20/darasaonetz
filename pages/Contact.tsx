import { motion } from "motion/react";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import ContactForm from "@/components/contact/ContactForm";
import images from "@/assets/images.json";

const LOCATION = "Dar es Salaam, Tanzania";

export default function Contact() {
  const { t } = useLanguage();
  const contactEmail = import.meta.env.VITE_WEBSITE_CONTACT_EMAIL as string | undefined;

  return (
    <>
      <SEOHead titleKey={t("pages.Contact.seo.title")} descriptionKey={t("pages.Contact.seo.description")} />
      <main>
        <section className="relative flex min-h-[55vh] items-end overflow-hidden px-gutter pb-block pt-section-spacing-mobile md:px-gutter-lg md:pt-section-spacing">
          <img src={images["contact.hero"]} data-image-id="contact.hero" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-night/70" />
          <motion.div
            initial={{ opacity: 0.001, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto flex w-full max-w-shell flex-col gap-stack"
          >
            <span data-text-id="pages.Contact.eyebrow" className="text-gradient-head text-sm uppercase tracking-widest">
              {t("pages.Contact.eyebrow")}
            </span>
            <h1
              data-text-id="pages.Contact.title"
              className="max-w-3xl font-heading leading-tight text-night-foreground"
              style={{ fontSize: "clamp(32px, 4vw, 52px)" }}
            >
              {t("pages.Contact.title")}
            </h1>
          </motion.div>
        </section>

        <section className="bg-background px-gutter py-section-spacing-mobile md:px-gutter-lg md:py-section-spacing">
          <div className="mx-auto grid max-w-shell grid-cols-1 gap-block lg:grid-cols-[3fr_2fr]">
            <ContactForm />

            <aside className="flex flex-col gap-block">
              <div className="flex flex-col gap-tight">
                <h2 data-text-id="pages.Contact.detailsHeading" className="font-heading text-xl text-ink">
                  {t("pages.Contact.detailsHeading")}
                </h2>
                <p data-text-id="pages.Contact.detailsBody" className="text-sm text-slate">
                  {t("pages.Contact.detailsBody")}
                </p>
              </div>

              {contactEmail ? (
                <div className="flex items-start gap-tight">
                  <Mail size={18} className="mt-0.5 text-accent" aria-hidden="true" />
                  <div className="flex flex-col">
                    <span data-text-id="pages.Contact.emailLabel" className="text-xs uppercase tracking-widest text-slate">
                      {t("pages.Contact.emailLabel")}
                    </span>
                    <a href={`mailto:${contactEmail}`} className="text-sm text-ink transition-opacity duration-base hover:opacity-70">
                      {contactEmail}
                    </a>
                  </div>
                </div>
              ) : null}

              <div className="flex items-start gap-tight">
                <MapPin size={18} className="mt-0.5 text-accent" aria-hidden="true" />
                <div className="flex flex-col">
                  <span data-text-id="pages.Contact.addressLabel" className="text-xs uppercase tracking-widest text-slate">
                    {t("pages.Contact.addressLabel")}
                  </span>
                  <span data-text-id="pages.Contact.addressValue" className="text-sm text-ink">
                    {t("pages.Contact.addressValue")}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-tight">
                <MessageCircle size={18} className="mt-0.5 text-accent" aria-hidden="true" />
                <div className="flex flex-col">
                  <span data-text-id="pages.Contact.langLabel" className="text-xs uppercase tracking-widest text-slate">
                    {t("pages.Contact.langLabel")}
                  </span>
                  <span data-text-id="pages.Contact.langValue" className="text-sm text-ink">
                    {t("pages.Contact.langValue")}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-card border border-line">
                <iframe
                  title={t("pages.Contact.mapTitle")}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(LOCATION)}&output=embed`}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="h-64 w-full border-0"
                />
              </div>
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}
