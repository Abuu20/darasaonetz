import { createBrowserRouter } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import PublicLayout from '../components/layout/PublicLayout'
import AuthLayout from '../components/layout/AuthLayout'
import DashboardLayout from '../components/layout/DashboardLayout'
import ProtectedRoute from '../components/layout/ProtectedRoute'

// Pages
import Landing from '../pages/Public/Landing'
import Login from '../pages/Public/Login'
import Register from '../pages/Public/Register'
import About from '../pages/Public/About'

// Student pages
import StudentDashboard from '../pages/Student/StudentDashboard'
import MyCourses from '../pages/Student/MyCourses'
import BrowseCourses from '../pages/Student/BrowseCourses'
import CourseView from '../pages/Student/CourseView'
import StudentProfile from '../pages/Student/Profile'
import Wishlist from '../pages/Student/Wishlist'

// Teacher pages
import TeacherDashboard from '../pages/Teacher/TeacherDashboard'
import TeacherProfile from '../pages/Teacher/Profile'
import CreateCourse from '../pages/Teacher/CreateCourse'
import LessonManager from '../pages/Teacher/LessonManager'
import TeacherMyCourses from '../pages/Teacher/MyCourses'
import StudentsList from '../pages/Teacher/StudentsList'
import TeacherAnalytics from '../pages/Teacher/Analytics'
import TeacherCertificates from '../pages/Teacher/Certificates'

// Admin pages
import AdminDashboard from '../pages/Admin/AdminDashboard'
import UserManagement from '../pages/Admin/UserManagement'
import CourseApproval from '../pages/Admin/CourseApproval'
import Reports from '../pages/Admin/Reports'
import SystemSettings from '../pages/Admin/SystemSettings'
import CertificateManagement from '../pages/Admin/CertificateManagement'

// Certificate pages
import CertificateView from '../pages/CertificateView'
import VerifyCertificate from '../pages/VerifyCertificate'

export const router = createBrowserRouter([
  // Public routes
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <Landing /> },
      { path: 'about', element: <About /> }
    ]
  },
  
  // Auth routes
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Login /> }
    ]
  },
  {
    path: '/register',
    element: <AuthLayout />,
    children: [
      { index: true, element: <Register /> }
    ]
  },
  
  // Certificate routes (public for verification)
  {
    path: '/certificate/:id',
    element: <PublicLayout />,
    children: [
      { index: true, element: <CertificateView /> }
    ]
  },
  {
    path: '/verify/:token',
    element: <PublicLayout />,
    children: [
      { index: true, element: <VerifyCertificate /> }
    ]
  },
  
  // Protected Student routes
  {
    path: '/student',
    element: <ProtectedRoute role="student" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <StudentDashboard /> },
          { path: 'my-courses', element: <MyCourses /> },
          { path: 'browse', element: <BrowseCourses /> },
          { path: 'course/:courseId', element: <CourseView /> },
          { path: 'profile', element: <StudentProfile /> },
          { path: 'wishlist', element: <Wishlist /> }
        ]
      }
    ]
  },
  
  // Protected Teacher routes
  {
    path: '/teacher',
    element: <ProtectedRoute role="teacher" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <TeacherDashboard /> },
          { path: 'profile', element: <TeacherProfile /> },
          { path: 'courses', element: <TeacherMyCourses /> },
          { path: 'courses/new', element: <CreateCourse /> },
          { path: 'courses/:courseId/lessons', element: <LessonManager /> },
          { path: 'students', element: <StudentsList /> },
          { path: 'analytics', element: <TeacherAnalytics /> },
          { path: 'certificates', element: <TeacherCertificates /> }
        ]
      }
    ]
  },

  // Protected Admin routes
  {
    path: '/admin',
    element: <ProtectedRoute role="admin" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <AdminDashboard /> },
          { path: 'users', element: <UserManagement /> },
          { path: 'courses', element: <CourseApproval /> },
          { path: 'certificates', element: <CertificateManagement /> },
          { path: 'reports', element: <Reports /> },
          { path: 'settings', element: <SystemSettings /> }
        ]
      }
    ]
  }
])
