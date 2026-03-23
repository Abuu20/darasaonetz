import { lazy, Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import PublicLayout from '../components/layout/PublicLayout'
import AuthLayout from '../components/layout/AuthLayout'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'
import { Spinner } from '../components/ui'
import TeacherForum from '../pages/Teacher/TeacherForum'
import ForumManagement from '../pages/Admin/ForumManagement'
import TeacherTopicDetail from '../pages/Teacher/TeacherTopicDetail'
import AllNotes from '../pages/Student/AllNotes'

// Lazy load pages
const Landing = lazy(() => import('../pages/Public/Landing'))
const Login = lazy(() => import('../pages/Public/Login'))
const Register = lazy(() => import('../pages/Public/Register'))
const About = lazy(() => import('../pages/Public/About'))
const StudentDashboard = lazy(() => import('../pages/Student/StudentDashboard'))
const MyCourses = lazy(() => import('../pages/Student/MyCourses'))
const BrowseCourses = lazy(() => import('../pages/Student/BrowseCourses'))
const CourseView = lazy(() => import('../pages/Student/CourseView'))
const StudentProfile = lazy(() => import('../pages/Student/Profile'))
const Wishlist = lazy(() => import('../pages/Student/Wishlist'))
const ShoppingCart = lazy(() => import('../pages/ShoppingCart'))
const ForumPage = lazy(() => import('../pages/ForumPage'))

const TeacherDashboard = lazy(() => import('../pages/Teacher/TeacherDashboard'))
const TeacherProfile = lazy(() => import('../pages/Teacher/Profile'))
const CreateCourse = lazy(() => import('../pages/Teacher/CreateCourse'))
const LessonManager = lazy(() => import('../pages/Teacher/LessonManager'))
const TeacherMyCourses = lazy(() => import('../pages/Teacher/MyCourses'))
const StudentsList = lazy(() => import('../pages/Teacher/StudentsList'))
const TeacherAnalytics = lazy(() => import('../pages/Teacher/Analytics'))
const TeacherCertificates = lazy(() => import('../pages/Teacher/Certificates'))

const AdminDashboard = lazy(() => import('../pages/Admin/AdminDashboard'))
const UserManagement = lazy(() => import('../pages/Admin/UserManagement'))
const CourseApproval = lazy(() => import('../pages/Admin/CourseApproval'))
const Reports = lazy(() => import('../pages/Admin/Reports'))
const SystemSettings = lazy(() => import('../pages/Admin/SystemSettings'))
const CertificateManagement = lazy(() => import('../pages/Admin/CertificateManagement'))

const CertificateView = lazy(() => import('../pages/CertificateView'))
const VerifyCertificate = lazy(() => import('../pages/VerifyCertificate'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Spinner size="lg" />
  </div>
)

const withSuspense = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(Landing) },
      { path: 'about', element: withSuspense(About) }
    ]
  },
  
  // Auth routes
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: withSuspense(Login) }
    ]
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      { index: true, element: withSuspense(Register) }
    ]
  },
  
  // Certificate routes
  {
    path: '/certificate/:id',
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(CertificateView) }
    ]
  },
  {
    path: '/verify/:token',
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(VerifyCertificate) }
    ]
  },
  
  // Student routes
  {
    path: '/student',
    element: <ProtectedRoute role="student" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(StudentDashboard) },
          { path: 'my-courses', element: withSuspense(MyCourses) },
          { path: 'browse', element: withSuspense(BrowseCourses) },
          { path: 'course/:courseId', element: withSuspense(CourseView) },
          { path: 'forum/:courseId', element: withSuspense(ForumPage) },
          { path: 'profile', element: withSuspense(StudentProfile) },
          { path: 'wishlist', element: withSuspense(Wishlist) },
          { path: 'cart', element: withSuspense(ShoppingCart) },
          { path: 'notes', element: withSuspense(AllNotes) }

        ]
      }
    ]
  },
  
  // Teacher routes
  {
    path: '/teacher',
    element: <ProtectedRoute role="teacher" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(TeacherDashboard) },
          { path: 'profile', element: withSuspense(TeacherProfile) },
          { path: 'courses', element: withSuspense(TeacherMyCourses) },
          { path: 'courses/new', element: withSuspense(CreateCourse) },
          { path: 'courses/:courseId/lessons', element: withSuspense(LessonManager) },
          { path: 'students', element: withSuspense(StudentsList) },
          { path: 'analytics', element: withSuspense(TeacherAnalytics) },
          { path: 'certificates', element: withSuspense(TeacherCertificates) },
          { path: 'forum/:courseId', element: withSuspense(TeacherForum) },
          { path: 'forum/:courseId/topic/:topicId', element: withSuspense(TeacherTopicDetail) },

        ]
      }
    ]
  },

  // Admin routes
  {
    path: '/admin',
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: withSuspense(AdminDashboard) },
          { path: 'users', element: withSuspense(UserManagement) },
          { path: 'courses', element: withSuspense(CourseApproval) },
          { path: 'certificates', element: withSuspense(CertificateManagement) },
          { path: 'reports', element: withSuspense(Reports) },
          { path: 'settings', element: withSuspense(SystemSettings) },
          { path: 'forum', element: withSuspense(ForumManagement) }

        ]
      }
    ]
  }
])
