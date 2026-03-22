import { formatCurrency as formatCurrencyHelper, formatDate as formatDateHelper } from './helpers'

// Format course data for display
export const formatCourse = (course) => {
  if (!course) return null
  
  return {
    ...course,
    formattedPrice: course.price ? formatCurrencyHelper(course.price) : 'Free',
    formattedDate: formatDateHelper(course.created_at),
    lessonCount: course.lessons?.length || 0,
    studentCount: course.enrollments?.length || 0,
    progress: course.progress || 0
  }
}

// Format lesson data for display
export const formatLesson = (lesson) => {
  if (!lesson) return null
  
  return {
    ...lesson,
    formattedDuration: lesson.duration ? `${lesson.duration} min` : 'No duration',
    hasVideo: !!lesson.video_url,
    hasContent: !!lesson.content
  }
}

// Format user data for display
export const formatUser = (user) => {
  if (!user) return null
  
  return {
    ...user,
    displayName: user.full_name || user.email?.split('@')[0] || 'User',
    initials: getInitials(user.full_name || user.email),
    joinDate: formatDateHelper(user.created_at),
    isAdmin: user.role === 'admin',
    isTeacher: user.role === 'teacher',
    isStudent: user.role === 'student'
  }
}

// Format enrollment data for display
export const formatEnrollment = (enrollment) => {
  if (!enrollment) return null
  
  return {
    ...enrollment,
    formattedDate: formatDateHelper(enrollment.enrolled_at),
    lastAccessed: enrollment.last_accessed ? formatDateHelper(enrollment.last_accessed) : 'Not started',
    progress: Math.round(enrollment.progress || 0)
  }
}

// Format file size for display
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Format duration for display
export const formatDuration = (minutes) => {
  if (!minutes) return 'No duration'
  
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours > 0) {
    return `${hours}h ${mins}m`
  }
  return `${mins} min`
}

// Format number with commas
export const formatNumber = (num) => {
  return num?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') || '0'
}

// Format percentage
export const formatPercentage = (value, decimals = 0) => {
  return `${value.toFixed(decimals)}%`
}

// Format rating
export const formatRating = (rating) => {
  if (!rating) return '0.0'
  return rating.toFixed(1)
}

// Format phone number
export const formatPhone = (phone) => {
  if (!phone) return ''
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Format based on length
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1,4)}) ${cleaned.slice(4,7)}-${cleaned.slice(7)}`
  }
  
  return phone
}

// Format address
export const formatAddress = (address) => {
  const parts = []
  
  if (address.line1) parts.push(address.line1)
  if (address.line2) parts.push(address.line2)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.postal_code) parts.push(address.postal_code)
  if (address.country) parts.push(address.country)
  
  return parts.join(', ')
}

// Format search term for display
export const formatSearchTerm = (term) => {
  return term?.trim().replace(/\s+/g, ' ') || ''
}

// Format list of items
export const formatList = (items, separator = ', ') => {
  if (!items || items.length === 0) return ''
  return items.join(separator)
}

// Format file name for display
export const formatFileName = (fileName, maxLength = 30) => {
  if (!fileName) return ''
  if (fileName.length <= maxLength) return fileName
  
  const ext = fileName.split('.').pop()
  const name = fileName.slice(0, fileName.lastIndexOf('.'))
  
  const truncatedName = name.slice(0, maxLength - 3 - ext.length)
  return `${truncatedName}...${ext}`
}

// Format time ago
export const formatTimeAgo = (date) => {
  const now = new Date()
  const past = new Date(date)
  const diffInSeconds = Math.floor((now - past) / 1000)
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
    second: 1
  }
  
  for (const [unit, seconds] of Object.entries(intervals)) {
    const interval = Math.floor(diffInSeconds / seconds)
    
    if (interval >= 1) {
      return interval === 1 ? `1 ${unit} ago` : `${interval} ${unit}s ago`
    }
  }
  
  return 'just now'
}

// Format stats for dashboard
export const formatStats = (stats) => {
  return {
    totalCourses: formatNumber(stats.totalCourses),
    totalStudents: formatNumber(stats.totalStudents),
    totalRevenue: formatCurrencyHelper(stats.totalRevenue),
    averageRating: formatRating(stats.averageRating),
    completionRate: formatPercentage(stats.completionRate || 0)
  }
}

// Format notification message
export const formatNotification = (notification) => {
  const templates = {
    course_approved: (data) => `Your course "${data.title}" has been approved!`,
    course_rejected: (data) => `Your course "${data.title}" was rejected: ${data.reason}`,
    new_enrollment: (data) => `${data.studentName} enrolled in your course "${data.courseTitle}"`,
    lesson_completed: (data) => `${data.studentName} completed "${data.lessonTitle}"`,
    new_course: (data) => `New course "${data.title}" created by ${data.teacherName}`,
    new_review: (data) => `${data.studentName} reviewed "${data.courseTitle}"`
  }
  
  const template = templates[notification.type]
  return template ? template(notification.data) : notification.message
}
