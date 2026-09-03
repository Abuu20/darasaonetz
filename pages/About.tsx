import SEOHead from "@/components/seo/SEOHead";
import { useLanguage } from "@/context/LanguageContext";
import MissionSection from "@/components/About/MissionSection";
import StatsSection from "@/components/About/StatsSection";
import TeacherVoice from "@/components/About/TeacherVoice";

export default function About() {
  const { t } = useLanguage();

  return (
    <>
      <SEOHead titleKey={t("pages.About.seo.title")} descriptionKey={t("pages.About.seo.description")} />
      <main className="pt-block">
        <MissionSection />
        <StatsSection />
        <TeacherVoice />
      </main>
    </>
  );
}
