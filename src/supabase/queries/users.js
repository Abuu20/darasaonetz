import { supabase } from '../client'

// Student specific queries
export const studentQueries = {
  // Get student's enrolled courses
  getEnrolledCourses: async (studentId) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses (
          *,
          categories (*),
          profiles!courses_teacher_id_fkey (full_name, avatar_url),
          lessons (count)
        )
      `)
      .eq('student_id', studentId)
      .order('last_accessed', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get student's completed lessons
  getCompletedLessons: async (studentId, courseId = null) => {
    let query = supabase
      .from('lesson_completions')
      .select(`
        *,
        lessons (*)
      `)
      .eq('student_id', studentId)

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data, error } = await query.order('completed_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get student's progress in a course
  getCourseProgress: async (studentId, courseId) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('progress, completed_lessons')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get student's overall stats
  getStats: async (studentId) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        id,
        progress,
        completed_at,
        courses!inner (
          lessons (count)
        )
      `)
      .eq('student_id', studentId)

    if (error) throw error

    const totalCourses = data.length
    const completedCourses = data.filter(e => e.progress === 100).length
    const inProgress = data.filter(e => e.progress > 0 && e.progress < 100).length
    const totalLessons = data.reduce((acc, e) => acc + (e.courses?.lessons?.length || 0), 0)
    const completedLessons = data.reduce((acc, e) => acc + (e.completed_lessons?.length || 0), 0)

    return {
      totalCourses,
      completedCourses,
      inProgress,
      totalLessons,
      completedLessons,
      overallProgress: totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
    }
  },

  // Enroll in course
  enrollInCourse: async (studentId, courseId) => {
    const { data, error } = await supabase
      .from('enrollments')
      .insert({
        student_id: studentId,
        course_id: courseId,
        progress: 0,
        completed_lessons: []
      })
      .select()
      .single()
    
    if (error) throw error

    // Increment enrolled students count
    await supabase.rpc('increment_enrolled_students', { course_id: courseId })

    return data
  },

  // Update last accessed
  updateLastAccessed: async (enrollmentId) => {
    const { error } = await supabase
      .from('enrollments')
      .update({ last_accessed: new Date().toISOString() })
      .eq('id', enrollmentId)
    
    if (error) throw error
    return true
  },

  // Mark lesson as complete
  completeLesson: async (studentId, lessonId, courseId) => {
    // Get current enrollment
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .select('*')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single()

    if (enrollError) throw enrollError

    // Check if already completed
    if (enrollment.completed_lessons?.includes(lessonId)) {
      return enrollment
    }

    // Add to completed lessons
    const updatedCompleted = [...(enrollment.completed_lessons || []), lessonId]

    // Get total lessons count
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('lessons(count)')
      .eq('id', courseId)
      .single()

    if (courseError) throw courseError

    const totalLessons = course?.lessons?.[0]?.count || 1
    const progress = (updatedCompleted.length / totalLessons) * 100

    // Update enrollment
    const { data, error } = await supabase
      .from('enrollments')
      .update({
        progress,
        completed_lessons: updatedCompleted,
        last_accessed: new Date().toISOString(),
        completed_at: progress === 100 ? new Date().toISOString() : null
      })
      .eq('id', enrollment.id)
      .select()
      .single()

    if (error) throw error

    // Add completion record
    await supabase
      .from('lesson_completions')
      .insert({
        student_id: studentId,
        lesson_id: lessonId,
        course_id: courseId
      })

    return data
  }
}

// Teacher specific queries
export const teacherQueries = {
  // Get teacher's courses with stats
  getCoursesWithStats: async (teacherId) => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        categories (*),
        lessons (count),
        enrollments (count),
        course_reviews (rating)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
    
    if (error) throw error

    // Calculate additional stats for each course
    return data.map(course => ({
      ...course,
      totalLessons: course.lessons?.[0]?.count || 0,
      totalStudents: course.enrollments?.length || 0,
      averageRating: course.course_reviews?.length
        ? course.course_reviews.reduce((acc, r) => acc + r.rating, 0) / course.course_reviews.length
        : 0,
      totalReviews: course.course_reviews?.length || 0
    }))
  },

  // Get teacher's students
  getStudents: async (teacherId) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        student_id,
        students:profiles!enrollments_student_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        courses!inner (
          id,
          title
        ),
        progress,
        completed_at,
        enrolled_at
      `)
      .in('course_id', supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', teacherId)
      )
      .order('enrolled_at', { ascending: false })

    if (error) throw error

    // Group by student
    const studentsMap = new Map()
    data.forEach(enrollment => {
      const student = enrollment.students
      if (!studentsMap.has(student.id)) {
        studentsMap.set(student.id, {
          ...student,
          courses: [],
          totalProgress: 0,
          completedCourses: 0
        })
      }
      
      const studentData = studentsMap.get(student.id)
      studentData.courses.push({
        id: enrollment.courses.id,
        title: enrollment.courses.title,
        progress: enrollment.progress,
        completed: enrollment.progress === 100,
        enrolled_at: enrollment.enrolled_at,
        completed_at: enrollment.completed_at
      })
      
      studentData.totalProgress += enrollment.progress
      if (enrollment.progress === 100) {
        studentData.completedCourses++
      }
    })

    return Array.from(studentsMap.values()).map(student => ({
      ...student,
      averageProgress: student.courses.length > 0 
        ? student.totalProgress / student.courses.length 
        : 0
    }))
  },

  // Get teacher's earnings
  getEarnings: async (teacherId, period = 'month') => {
    const { data, error } = await supabase
      .from('enrollments')
      .select(`
        *,
        courses!inner (
          id,
          title,
          price,
          teacher_id
        )
      `)
      .eq('courses.teacher_id', teacherId)
      .gte('enrolled_at', getDateRange(period))

    if (error) throw error

    const total = data.reduce((acc, e) => acc + (e.courses.price || 0), 0)
    const byCourse = data.reduce((acc, e) => {
      const courseId = e.courses.id
      if (!acc[courseId]) {
        acc[courseId] = {
          title: e.courses.title,
          count: 0,
          revenue: 0
        }
      }
      acc[courseId].count++
      acc[courseId].revenue += e.courses.price || 0
      return acc
    }, {})

    return {
      total,
      byCourse: Object.values(byCourse),
      count: data.length,
      period
    }
  }
}

// Admin specific queries
export const adminQueries = {
  // Get platform stats
  getPlatformStats: async () => {
    const [
      { count: totalUsers },
      { count: totalTeachers },
      { count: totalStudents },
      { count: totalCourses },
      { count: totalEnrollments },
      { data: revenueData }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase
        .from('enrollments')
        .select('courses!inner(price)')
        .not('courses.price', 'is', null)
    ])

    const totalRevenue = revenueData?.reduce((acc, e) => acc + (e.courses.price || 0), 0) || 0

    return {
      totalUsers: totalUsers || 0,
      totalTeachers: totalTeachers || 0,
      totalStudents: totalStudents || 0,
      totalCourses: totalCourses || 0,
      totalEnrollments: totalEnrollments || 0,
      totalRevenue
    }
  },

  // Get recent activities
  getRecentActivities: async (limit = 10) => {
    const [recentUsers, recentCourses, recentEnrollments] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('courses')
        .select('id, title, status, created_at, profiles!teacher_id(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabase
        .from('enrollments')
        .select('id, enrolled_at, student_id, course_id, profiles!student_id(full_name), courses!inner(title)')
        .order('enrolled_at', { ascending: false })
        .limit(limit)
    ])

    const activities = [
      ...recentUsers.data.map(u => ({
        type: 'user_created',
        description: `${u.full_name || u.email} joined as ${u.role}`,
        time: u.created_at,
        data: u
      })),
      ...recentCourses.data.map(c => ({
        type: 'course_created',
        description: `"${c.title}" was created by ${c.profiles?.full_name}`,
        status: c.status,
        time: c.created_at,
        data: c
      })),
      ...recentEnrollments.data.map(e => ({
        type: 'enrollment',
        description: `${e.profiles?.full_name} enrolled in "${e.courses?.title}"`,
        time: e.enrolled_at,
        data: e
      }))
    ]

    return activities
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit)
  }
}

// Helper function
function getDateRange(period) {
  const now = new Date()
  switch (period) {
    case 'week':
      return new Date(now.setDate(now.getDate() - 7)).toISOString()
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1)).toISOString()
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1)).toISOString()
    default:
      return new Date(0).toISOString()
  }
}


// Wishlist queries
export const wishlistQueries = {
  // Get student's wishlist
  getWishlist: async (studentId) => {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          thumbnail_url,
          level,
          price,
          average_rating,
          review_count,
          profiles:teacher_id (
            full_name
          )
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Add to wishlist
  addToWishlist: async (studentId, courseId) => {
    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        student_id: studentId,
        course_id: courseId
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Remove from wishlist
  removeFromWishlist: async (studentId, courseId) => {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('student_id', studentId)
      .eq('course_id', courseId)
    
    if (error) throw error
    return true
  },

  // Check if course is in wishlist
  isInWishlist: async (studentId, courseId) => {
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return !!data
  },

  // Get wishlist count
  getWishlistCount: async (studentId) => {
    const { count, error } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
    
    if (error) throw error
    return count || 0
  },

  // Move wishlist items to cart (for future payment)
  moveToCart: async (studentId, courseIds) => {
    // Delete from wishlist
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('student_id', studentId)
      .in('course_id', courseIds)
    
    if (error) throw error
    return true
  }
}

// Email notification queries
export const notificationQueries = {
  // Get user notifications
  getNotifications: async (userId, limit = 50, unreadOnly = false) => {
    let query = supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (unreadOnly) {
      query = query.eq('is_read', false)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const { error } = await supabase
      .from('email_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
    
    if (error) throw error
    return true
  },

  // Mark all as read
  markAllAsRead: async (userId) => {
    const { error } = await supabase
      .from('email_notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
    return true
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const { error } = await supabase
      .from('email_notifications')
      .delete()
      .eq('id', notificationId)
    
    if (error) throw error
    return true
  },

  // Get unread count
  getUnreadCount: async (userId) => {
    const { count, error } = await supabase
      .from('email_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
    
    if (error) throw error
    return count || 0
  },

  // Create notification (server-side)
  createNotification: async (userId, type, title, content, data = null) => {
    const { data: result, error } = await supabase.rpc('create_notification', {
      p_user_id: userId,
      p_type: type,
      p_title: title,
      p_content: content,
      p_data: data
    })
    
    if (error) throw error
    return result
  }
}
