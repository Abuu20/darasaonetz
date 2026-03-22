export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  ABOUT: '/about',
  
  // Student routes
  STUDENT_DASHBOARD: '/student',
  STUDENT_MY_COURSES: '/student/my-courses',
  STUDENT_BROWSE: '/student/browse',
  STUDENT_COURSE: (id) => `/student/course/${id}`,
  STUDENT_PROFILE: '/student/profile',
  
  // Teacher routes
  TEACHER_DASHBOARD: '/teacher',
  TEACHER_PROFILE: '/teacher/profile',
  TEACHER_COURSES: '/teacher/courses',
  TEACHER_CREATE_COURSE: '/teacher/courses/new',
  TEACHER_EDIT_COURSE: (id) => `/teacher/courses/${id}/edit`,
  TEACHER_LESSONS: (id) => `/teacher/courses/${id}/lessons`,
  TEACHER_STUDENTS: '/teacher/students',
  TEACHER_ANALYTICS: '/teacher/analytics',
  
  // Admin routes
  ADMIN_DASHBOARD: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_COURSES: '/admin/courses',
  ADMIN_REPORTS: '/admin/reports',
  ADMIN_SETTINGS: '/admin/settings'
}
