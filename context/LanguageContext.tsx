import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type LocaleDict = Record<string, string>;

// All locale JSON is bundled at build time and merged into one dictionary per language.
//
// New layout: mirrored per-source-file files under assets/locales/<lang>/** (keys are
// path-prefixed and unique). Adding a namespace = drop in a new file; adding a language =
// copy the assets/locales/<lang>/ subtree — no edits to this file are ever needed.
//
// Legacy layout (kept for backward compatibility with sites not yet migrated): the flat
// assets/<lang>.json file. Both are merged; mirrored files win on a key clash so a
// half-migrated project (some keys moved, the rest still in assets/<lang>.json) stays
// correct.
const mirroredModules = import.meta.glob("@/assets/locales/**/*.json", { eager: true });
const legacyModules = import.meta.glob("@/assets/*.json", { eager: true });

const asDict = (mod: unknown): LocaleDict => {
  const value = (mod as { default?: unknown })?.default ?? mod;
  return value && typeof value === "object" ? (value as LocaleDict) : {};
};

const buildLocales = (): Record<string, LocaleDict> => {
  const locales: Record<string, LocaleDict> = {};
  const merge = (lang: string, dict: LocaleDict) => {
    locales[lang] = { ...(locales[lang] ?? {}), ...dict };
  };

  // Legacy first (lower precedence).
  for (const [path, mod] of Object.entries(legacyModules)) {
    // Only files named with a 2-letter ISO code are locales; skip assets/images.json etc.
    const match = path.match(/\/assets\/([A-Za-z]{2}(?:-[A-Za-z]{2})?)\.json$/);
    if (!match) continue;
    merge(match[1], asDict(mod));
  }

  // Mirrored second (higher precedence — wins on key clash during migration).
  for (const [path, mod] of Object.entries(mirroredModules)) {
    // assets/locales/<lang>/<...>.json — the language is the first segment after assets/locales/.
    const match = path.match(/\/assets\/locales\/([^/]+)\//);
    if (!match) continue;
    merge(match[1], asDict(mod));
  }

  return locales;
};

const locales = buildLocales();

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<string>("en");

  // Reflect the active language on <html lang> (a11y/SEO, and so tools can read it).
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return locales[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
