import { supabase } from '../client'

// Bucket names
export const BUCKETS = {
  AVATARS: 'avatars',
  COURSE_THUMBNAILS: 'course-thumbnails',
  LESSON_VIDEOS: 'lesson-videos'
}

// Avatar storage
export const avatarStorage = {
  // Upload avatar
  upload: async (userId, file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/avatar.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from(BUCKETS.AVATARS)
      .upload(filePath, file, { upsert: true })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.AVATARS)
      .getPublicUrl(filePath)

    return publicUrl
  },

  // Delete avatar
  delete: async (userId) => {
    const { data: files } = await supabase.storage
      .from(BUCKETS.AVATARS)
      .list(userId)

    if (files?.length > 0) {
      const filesToDelete = files.map(f => `${userId}/${f.name}`)
      const { error } = await supabase.storage
        .from(BUCKETS.AVATARS)
        .remove(filesToDelete)

      if (error) throw error
    }

    return true
  },

  // Get avatar URL
  getUrl: (path) => {
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.AVATARS)
      .getPublicUrl(path)

    return publicUrl
  }
}

// Course thumbnail storage
export const thumbnailStorage = {
  // Upload thumbnail
  upload: async (courseId, file) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${courseId}/${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from(BUCKETS.COURSE_THUMBNAILS)
      .upload(filePath, file)

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.COURSE_THUMBNAILS)
      .getPublicUrl(filePath)

    return publicUrl
  },

  // Delete thumbnail
  delete: async (courseId) => {
    const { data: files } = await supabase.storage
      .from(BUCKETS.COURSE_THUMBNAILS)
      .list(courseId)

    if (files?.length > 0) {
      const filesToDelete = files.map(f => `${courseId}/${f.name}`)
      const { error } = await supabase.storage
        .from(BUCKETS.COURSE_THUMBNAILS)
        .remove(filesToDelete)

      if (error) throw error
    }

    return true
  },

  // Update thumbnail (delete old, upload new)
  update: async (courseId, file) => {
    await thumbnailStorage.delete(courseId)
    return thumbnailStorage.upload(courseId, file)
  },

  // Get thumbnail URL
  getUrl: (path) => {
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.COURSE_THUMBNAILS)
      .getPublicUrl(path)

    return publicUrl
  }
}

// Lesson video storage
export const videoStorage = {
  // Upload video
  upload: async (courseId, lessonId, file, onProgress = null) => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${courseId}/${lessonId}/${Date.now()}.${fileExt}`
    const filePath = `${fileName}`

    const { error } = await supabase.storage
      .from(BUCKETS.LESSON_VIDEOS)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from(BUCKETS.LESSON_VIDEOS)
      .getPublicUrl(filePath)

    return publicUrl
  },

  // Delete video
  delete: async (courseId, lessonId) => {
    const { data: files } = await supabase.storage
      .from(BUCKETS.LESSON_VIDEOS)
      .list(`${courseId}/${lessonId}`)

    if (files?.length > 0) {
      const filesToDelete = files.map(f => `${courseId}/${lessonId}/${f.name}`)
      const { error } = await supabase.storage
        .from(BUCKETS.LESSON_VIDEOS)
        .remove(filesToDelete)

      if (error) throw error
    }

    return true
  },

  // Get signed URL (for private videos)
  getSignedUrl: async (path, expiresIn = 3600) => {
    const { data, error } = await supabase.storage
      .from(BUCKETS.LESSON_VIDEOS)
      .createSignedUrl(path, expiresIn)

    if (error) throw error
    return data.signedUrl
  },

  // Check if user has access to video
  canAccess: async (userId, path) => {
    // Extract courseId from path
    const parts = path.split('/')
    const courseId = parts[0]

    // Check if user is teacher of the course
    const { data: course } = await supabase
      .from('courses')
      .select('teacher_id')
      .eq('id', courseId)
      .single()

    if (course?.teacher_id === userId) return true

    // Check if user is enrolled
    const { data: enrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', userId)
      .eq('course_id', courseId)
      .single()

    return !!enrollment
  }
}

// General storage helpers
export const storageHelpers = {
  // List files in a bucket
  listFiles: async (bucket, path = '') => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path)

    if (error) throw error
    return data
  },

  // Delete file
  deleteFile: async (bucket, path) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (error) throw error
    return true
  },

  // Delete multiple files
  deleteFiles: async (bucket, paths) => {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)

    if (error) throw error
    return true
  },

  // Get file info
  getFileInfo: async (bucket, path) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .info(path)

    if (error) throw error
    return data
  },

  // Copy file
  copyFile: async (bucket, fromPath, toPath) => {
    const { error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath)

    if (error) throw error
    return true
  },

  // Move file
  moveFile: async (bucket, fromPath, toPath) => {
    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath)

    if (error) throw error
    return true
  },

  // Create bucket (admin only)
  createBucket: async (bucketId, isPublic = true) => {
    const { error } = await supabase.storage
      .createBucket(bucketId, {
        public: isPublic,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: isPublic 
          ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
          : ['video/mp4', 'video/webm', 'video/ogg']
      })

    if (error) throw error
    return true
  },

  // Empty bucket
  emptyBucket: async (bucketId) => {
    const { data: files } = await supabase.storage
      .from(bucketId)
      .list()

    if (files?.length > 0) {
      const paths = files.map(f => f.name)
      const { error } = await supabase.storage
        .from(bucketId)
        .remove(paths)

      if (error) throw error
    }

    return true
  },

  // Delete bucket
  deleteBucket: async (bucketId) => {
    await storageHelpers.emptyBucket(bucketId)
    
    const { error } = await supabase.storage
      .deleteBucket(bucketId)

    if (error) throw error
    return true
  }
}
