import { Navigate, useParams, useSearchParams } from "react-router-dom";
import SEOHead from "@/components/seo/SEOHead";
import LessonViewer from "@/components/learn/LessonViewer";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

/**
 * /learn/:id — wrapped by <LearnLayout> in App.tsx, which supplies the
 * DashUI shell (sidebar + topbar), the course sub-header, and the
 * curriculum sidebar. This page therefore renders LessonViewer with the
 * "embedded" variant so the viewer doesn't duplicate any of that chrome.
 */
export default function Learn() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();

  const deepLinkedLesson = searchParams.get("lesson");

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-pill border-4 border-line border-t-accent" />
      </div>
    );
  }

  if (!user) return <Navigate to={`/courses/${id}`} replace />;
  if (!id) return <Navigate to="/courses" replace />;

  return (
    <>
      <SEOHead titleKey={t("pages.Learn.seoPrefix")} descriptionKey="" />
      <LessonViewer
        courseId={id}
        variant="embedded"
        initialLessonId={deepLinkedLesson}
      />
    </>
  );
}
