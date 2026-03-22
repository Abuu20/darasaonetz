// App constants
export const APP_NAME = 'Darasaone'
export const APP_DESCRIPTION = 'Digital Admin Management Platform for Teachers'

// User roles
export const ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
}

// Course levels
export const COURSE_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
}

export const COURSE_LEVEL_LABELS = {
  [COURSE_LEVELS.BEGINNER]: 'Beginner',
  [COURSE_LEVELS.INTERMEDIATE]: 'Intermediate',
  [COURSE_LEVELS.ADVANCED]: 'Advanced'
}

// Course status
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
}

export const COURSE_STATUS_LABELS = {
  [COURSE_STATUS.DRAFT]: 'Draft',
  [COURSE_STATUS.PENDING]: 'Pending Review',
  [COURSE_STATUS.PUBLISHED]: 'Published',
  [COURSE_STATUS.ARCHIVED]: 'Archived'
}

export const COURSE_STATUS_COLORS = {
  [COURSE_STATUS.DRAFT]: 'gray',
  [COURSE_STATUS.PENDING]: 'orange',
  [COURSE_STATUS.PUBLISHED]: 'green',
  [COURSE_STATUS.ARCHIVED]: 'red'
}

// Course types
export const COURSE_TYPES = {
  ISLAMIC: 'islamic',
  ACADEMIC: 'academic'
}

export const COURSE_TYPE_LABELS = {
  [COURSE_TYPES.ISLAMIC]: 'Islamic',
  [COURSE_TYPES.ACADEMIC]: 'Academic'
}

// Pagination
export const ITEMS_PER_PAGE = 10
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

// File types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg']

// Local storage keys
export const STORAGE_KEYS = {
  THEME: 'darasaone-theme',
  AUTH: 'darasaone-auth',
  SETTINGS: 'darasaone-settings'
}

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    RESET_PASSWORD: '/auth/reset-password'
  },
  COURSES: {
    BASE: '/courses',
    LESSONS: '/courses/:id/lessons',
    ENROLL: '/courses/:id/enroll'
  },
  USERS: {
    PROFILE: '/users/profile',
    SETTINGS: '/users/settings'
  }
}

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  SERVER: 'Server error. Please try again later.',
  VALIDATION: 'Please check your input and try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type not allowed.'
}

// Success messages
export const SUCCESS_MESSAGES = {
  COURSE_CREATED: 'Course created successfully!',
  COURSE_UPDATED: 'Course updated successfully!',
  COURSE_DELETED: 'Course deleted successfully!',
  LESSON_CREATED: 'Lesson created successfully!',
  LESSON_UPDATED: 'Lesson updated successfully!',
  LESSON_DELETED: 'Lesson deleted successfully!',
  ENROLLMENT_SUCCESS: 'Successfully enrolled in course!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  AVATAR_UPLOADED: 'Avatar uploaded successfully!'
}

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  API: 'yyyy-MM-dd',
  API_WITH_TIME: "yyyy-MM-dd'T'HH:mm:ss'Z'"
}

// Validation rules
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 6,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 10,
  DESCRIPTION_MAX_LENGTH: 2000,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50
}
