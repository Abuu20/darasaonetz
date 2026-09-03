import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import Hero from "@/components/Home/Hero";
import TrustedSection from "@/components/Home/TrustedSection";
import FreedomSection from "@/components/Home/FreedomSection";
import PrecisionSection from "@/components/Home/PrecisionSection";
import FeaturedCourses from "@/components/Home/FeaturedCourses";
import NewsletterSection from "@/components/Home/NewsletterSection";

export default function Home() {
  const { t } = useLanguage();

  return (
    <>
      <SEOHead titleKey={t("pages.Home.seo.title")} descriptionKey={t("pages.Home.seo.description")} />
      <main>
        <Hero />
        <TrustedSection />
        <FreedomSection />
        <PrecisionSection />
        <FeaturedCourses />
        <NewsletterSection />
      </main>
    </>
  );
}
