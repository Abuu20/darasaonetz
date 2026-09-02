import { useState, type FormEvent } from "react";
import { motion } from "motion/react";
import { emailService } from "@/lib/db/email";
import { useLanguage } from "@/context/LanguageContext";

const blurUp = {
  initial: { opacity: 0.001, y: 40, filter: "blur(12px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.9, ease: "easeOut" },
} as const;

export default function NewsletterSection() {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email) return;
    setStatus("sending");
    try {
      await emailService.subscribeNewsletter(email);
      setStatus("done");
      setEmail("");
    } catch (err) {
      console.error("[Newsletter] error:", err);
      setStatus("error");
    }
  };

  return (
    <section className="relative overflow-hidden bg-night px-gutter py-section-spacing-mobile text-night-foreground md:px-gutter-lg md:py-section-spacing">
      <div className="mx-auto flex max-w-shell flex-col gap-block">
        <motion.div {...blurUp}>
          <p className="font-heading leading-[0.95]" style={{ fontSize: "clamp(48px, 9vw, 120px)" }}>
            <span data-text-id="components.Home.NewsletterSection.headA">{t("components.Home.NewsletterSection.headA")}</span>{" "}
            <span data-text-id="components.Home.NewsletterSection.headB" className="text-gradient-head">
              {t("components.Home.NewsletterSection.headB")}
            </span>
          </p>
          <p
            data-text-id="components.Home.NewsletterSection.headC"
            className="leading-[1.05] text-lavender"
            style={{ fontSize: "clamp(24px, 3vw, 48px)" }}
          >
            {t("components.Home.NewsletterSection.headC")}
          </p>
        </motion.div>

        <motion.div {...blurUp} transition={{ ...blurUp.transition, delay: 0.2 }} className="max-w-prose">
          <p data-text-id="components.Home.NewsletterSection.blurb" className="mb-stack text-base text-lilac">
            {t("components.Home.NewsletterSection.blurb")}
          </p>
          <form className="flex items-center gap-tight border-b border-lavender/50 pb-2" onSubmit={handleSubmit}>
            <label className="sr-only" htmlFor="newsletter-email">
              <span data-text-id="components.Home.NewsletterSection.label">{t("components.Home.NewsletterSection.label")}</span>
            </label>
            <input
              id="newsletter-email"
              type="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder={t("components.Home.NewsletterSection.placeholder")}
              className="flex-1 bg-transparent text-base text-night-foreground outline-none placeholder:text-lavender"
            />
            <button
              type="submit"
              disabled={status === "sending"}
              className="whitespace-nowrap text-xs uppercase tracking-[0.25em] text-night-foreground transition-opacity duration-base hover:opacity-80 disabled:opacity-50"
            >
              <span data-text-id="components.Home.NewsletterSection.submit">{t("components.Home.NewsletterSection.submit")}</span>
            </button>
          </form>
          {status === "done" ? (
            <p data-text-id="components.Home.NewsletterSection.success" className="mt-stack text-sm text-success">
              {t("components.Home.NewsletterSection.success")}
            </p>
          ) : null}
          {status === "error" ? (
            <p data-text-id="components.Home.NewsletterSection.error" className="mt-stack text-sm text-danger">
              {t("components.Home.NewsletterSection.error")}
            </p>
          ) : null}
        </motion.div>
      </div>
    </section>
  );
}
