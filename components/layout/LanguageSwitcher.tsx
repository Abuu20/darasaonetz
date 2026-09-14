import { Languages } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const LANGUAGES = [
  { id: "en", code: "en", labelKey: "components.layout.LanguageSwitcher.en" },
  { id: "sw", code: "sw", labelKey: "components.layout.LanguageSwitcher.sw" },
] as const;

export default function LanguageSwitcher({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { language, setLanguage, t } = useLanguage();
  const base = tone === "dark" ? "text-lilac hover:text-night-foreground" : "text-slate hover:text-ink";

  return (
    <div className="flex items-center gap-1" aria-label={t("components.layout.LanguageSwitcher.label")}>
      <Languages size={16} className={tone === "dark" ? "text-lavender" : "text-slate"} aria-hidden="true" />
      {LANGUAGES.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => setLanguage(item.code)}
          aria-pressed={language === item.code}
          className={`rounded-pill px-tight py-1 text-xs uppercase tracking-widest transition-colors duration-base ${
            language === item.code ? (tone === "dark" ? "text-night-foreground" : "text-ink") : base
          }`}
        >
          <span data-text-id={item.labelKey}>{t(item.labelKey)}</span>
        </button>
      ))}
    </div>
  );
}
