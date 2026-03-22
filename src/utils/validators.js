import { VALIDATION_RULES, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES } from './constants'

// Validate email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password
export const isValidPassword = (password) => {
  return password && password.length >= VALIDATION_RULES.PASSWORD_MIN_LENGTH
}

// Validate password match
export const doPasswordsMatch = (password, confirmPassword) => {
  return password === confirmPassword
}

// Validate name
export const isValidName = (name) => {
  return name && 
    name.length >= VALIDATION_RULES.NAME_MIN_LENGTH && 
    name.length <= VALIDATION_RULES.NAME_MAX_LENGTH
}

// Validate title
export const isValidTitle = (title) => {
  return title && 
    title.length >= VALIDATION_RULES.TITLE_MIN_LENGTH && 
    title.length <= VALIDATION_RULES.TITLE_MAX_LENGTH
}

// Validate description
export const isValidDescription = (description) => {
  return description && 
    description.length >= VALIDATION_RULES.DESCRIPTION_MIN_LENGTH && 
    description.length <= VALIDATION_RULES.DESCRIPTION_MAX_LENGTH
}

// Validate price
export const isValidPrice = (price) => {
  const num = parseFloat(price)
  return !isNaN(num) && num >= 0
}

// Validate URL
export const isValidUrl = (url) => {
  if (!url) return true // Optional field
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Validate phone number
export const isValidPhone = (phone) => {
  if (!phone) return true // Optional field
  const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
  return phoneRegex.test(phone)
}

// Validate file type
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type)
}

// Validate image file
export const isValidImage = (file) => {
  return isValidFileType(file, ALLOWED_IMAGE_TYPES)
}

// Validate video file
export const isValidVideo = (file) => {
  return isValidFileType(file, ALLOWED_VIDEO_TYPES)
}

// Validate file size
export const isValidFileSize = (file, maxSize) => {
  return file.size <= maxSize
}

// Validate course data
export const validateCourse = (courseData) => {
  const errors = {}
  
  if (!isValidTitle(courseData.title)) {
    errors.title = `Title must be between ${VALIDATION_RULES.TITLE_MIN_LENGTH} and ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters`
  }
  
  if (!isValidDescription(courseData.description)) {
    errors.description = `Description must be between ${VALIDATION_RULES.DESCRIPTION_MIN_LENGTH} and ${VALIDATION_RULES.DESCRIPTION_MAX_LENGTH} characters`
  }
  
  if (!isValidPrice(courseData.price)) {
    errors.price = 'Price must be a valid number'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate lesson data
export const validateLesson = (lessonData) => {
  const errors = {}
  
  if (!isValidTitle(lessonData.title)) {
    errors.title = `Title must be between ${VALIDATION_RULES.TITLE_MIN_LENGTH} and ${VALIDATION_RULES.TITLE_MAX_LENGTH} characters`
  }
  
  if (lessonData.video_url && !isValidUrl(lessonData.video_url)) {
    errors.video_url = 'Please enter a valid URL'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate registration data
export const validateRegistration = (data) => {
  const errors = {}
  
  if (!isValidName(data.fullName)) {
    errors.fullName = `Name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`
  }
  
  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (!isValidPassword(data.password)) {
    errors.password = `Password must be at least ${VALIDATION_RULES.PASSWORD_MIN_LENGTH} characters`
  }
  
  if (!doPasswordsMatch(data.password, data.confirmPassword)) {
    errors.confirmPassword = 'Passwords do not match'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate login data
export const validateLogin = (data) => {
  const errors = {}
  
  if (!isValidEmail(data.email)) {
    errors.email = 'Please enter a valid email address'
  }
  
  if (!data.password) {
    errors.password = 'Password is required'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Validate profile data
export const validateProfile = (data) => {
  const errors = {}
  
  if (data.full_name && !isValidName(data.full_name)) {
    errors.full_name = `Name must be between ${VALIDATION_RULES.NAME_MIN_LENGTH} and ${VALIDATION_RULES.NAME_MAX_LENGTH} characters`
  }
  
  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Please enter a valid phone number'
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}
