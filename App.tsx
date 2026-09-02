import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Suspense, lazy, type ReactNode } from "react";
import ScrollTopRouting from "@/components/routing/ScrollTopRouting";
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import InstallPrompt from "@/components/pwa/InstallPrompt";
import Home from "@/pages/Home";

// Everything past the landing page is lazy — a reload (tab switch,
// backgrounding, a real crash) only has to re-parse the Home bundle before
// the page is interactive again, instead of the whole site's JS every
// single time. Home itself stays eager since it's what most reloads land
// back on.
const Courses = lazy(() => import("@/pages/Courses"));
const CourseDetail = lazy(() => import("@/pages/CourseDetail"));
const Learn = lazy(() => import("@/pages/Learn"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const Account = lazy(() => import("@/pages/Account"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const TeacherDashboard = lazy(() => import("@/pages/teacher/TeacherDashboard"));

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-hairline border-t-accent" aria-hidden="true" />
    </div>
  );
}

// The /learn player is a full-height, distraction-free workspace (like
// Udemy/Coursera's course player) — the floating marketing header and
// footer would eat into the video space and don't belong there.
function SiteChrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const isLearning = pathname.startsWith("/learn/");
  if (isLearning) return <>{children}</>;
  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollTopRouting />
        <SiteChrome>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />
              <Route path="/learn/:id" element={<Learn />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/account" element={<Account />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Routes>
          </Suspense>
        </SiteChrome>
        <InstallPrompt />
      </BrowserRouter>
    </AuthProvider>
  );
}