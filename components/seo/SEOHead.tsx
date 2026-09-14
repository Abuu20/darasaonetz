import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import images from "@/assets/images.json";

interface SEOHeadProps {
  titleKey?: string;
  descriptionKey?: string;
  ogImage?: string;
  ogImageKey?: string;
}

// Canonical <head> for every page. Render exactly one <SEOHead /> per page
// inside pages/*.tsx; no raw <Helmet> anywhere else. Pulls og:image from
// assets/images.json by default so social sharing works without extra wiring.
//
// titleKey / descriptionKey take the DISPLAY VALUE: literal text on a
// monolingual/inline site, or a pre-translated value (t('…')) when the project
// externalizes text. The legacy prop names are kept on purpose — existing
// projects ship a SEOHead with the same names (translating internally, where
// t() falls back to the given string), so one prompt directive stays correct
// for every project. No useLanguage() here: this component must not depend on
// LanguageProvider.
export function SEOHead({
  titleKey = "Darasaone",
  descriptionKey = "Darasaone — Islamic and Arabic studies online, in English and Swahili.",
  ogImage,
  ogImageKey = "og_image",
}: SEOHeadProps) {
  const location = useLocation();
  const siteTitle = import.meta.env.VITE_METADATA_TITLE as string | undefined;
  const siteUrl = (import.meta.env.VITE_APP_URL as string | undefined)?.replace(/\/$/, "") ?? "";
  const metaTitle = siteTitle && siteTitle !== titleKey ? `${titleKey} | ${siteTitle}` : titleKey;
  const resolvedOg =
    ogImage ?? (images as Record<string, string>)[ogImageKey];
  const canonicalUrl = siteUrl ? `${siteUrl}${location.pathname}` : undefined;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      <meta name="description" content={descriptionKey} />
      {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
      <meta property="og:title" content={metaTitle} />
      <meta property="og:description" content={descriptionKey} />
      <meta property="og:type" content="website" />
      {canonicalUrl ? <meta property="og:url" content={canonicalUrl} /> : null}
      {resolvedOg ? <meta property="og:image" content={resolvedOg} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      {resolvedOg ? <meta name="twitter:image" content={resolvedOg} /> : null}
    </Helmet>
  );
}

export default SEOHead;
