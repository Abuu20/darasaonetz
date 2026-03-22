import { supabase } from '../client'

// Category queries
export const categoryQueries = {
  // Get all categories
  getAll: async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data
  },

  // Get category by ID
  getById: async (categoryId) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', categoryId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get categories by type
  getByType: async (type) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('type', type)
      .order('name')
    
    if (error) throw error
    return data
  },

  // Create category (admin only)
  create: async (categoryData) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([categoryData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update category (admin only)
  update: async (categoryId, updates) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', categoryId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete category (admin only)
  delete: async (categoryId) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId)
    
    if (error) throw error
    return true
  }
}

// Course queries
export const courseQueries = {
  // Get all published courses with filters
  getPublished: async (filters = {}) => {
    let query = supabase
      .from('courses')
      .select(`
        *,
        categories (*),
        profiles!courses_teacher_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        ),
        lessons (count)
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.category_id) {
      query = query.eq('category_id', filters.category_id)
    }
    if (filters.level) {
      query = query.eq('level', filters.level)
    }
    if (filters.type) {
      query = query.eq('type', filters.type)
    }
    if (filters.teacher_id) {
      query = query.eq('teacher_id', filters.teacher_id)
    }
    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters.min_price) {
      query = query.gte('price', filters.min_price)
    }
    if (filters.max_price) {
      query = query.lte('price', filters.max_price)
    }

    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Get course by ID with all relations
  getById: async (courseId) => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        categories (*),
        profiles!courses_teacher_id_fkey (
          id,
          full_name,
          email,
          avatar_url,
          bio
        ),
        lessons (
          *,
          lesson_completions (
            student_id,
            completed_at
          )
        )
      `)
      .eq('id', courseId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get courses by teacher
  getByTeacher: async (teacherId, includeAll = false) => {
    let query = supabase
      .from('courses')
      .select(`
        *,
        categories (*),
        lessons (count),
        enrollments (count)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (!includeAll) {
      query = query.neq('status', 'archived')
    }

    const { data, error } = await query
    
    if (error) throw error
    return data
  },

  // Create course
  create: async (courseData) => {
    const { data, error } = await supabase
      .from('courses')
      .insert([courseData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update course
  update: async (courseId, updates) => {
    const { data, error } = await supabase
      .from('courses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', courseId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete course
  delete: async (courseId) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
    
    if (error) throw error
    return true
  },

  // Get course stats
  getStats: async (courseId) => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        enrollments (count),
        lessons (count),
        lesson_completions:lessons (
          lesson_completions (count)
        )
      `)
      .eq('id', courseId)
      .single()
    
    if (error) throw error
    
    // Calculate additional stats
    const totalEnrollments = data.enrollments?.[0]?.count || 0
    const totalLessons = data.lessons?.[0]?.count || 0
    const totalCompletions = data.lesson_completions?.reduce(
      (acc, lesson) => acc + (lesson.lesson_completions?.[0]?.count || 0), 0
    ) || 0

    return {
      ...data,
      totalEnrollments,
      totalLessons,
      totalCompletions,
      completionRate: totalLessons > 0 
        ? (totalCompletions / (totalEnrollments * totalLessons)) * 100 
        : 0
    }
  },

  // Search courses
  search: async (searchTerm) => {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        categories (*),
        profiles!courses_teacher_id_fkey (full_name)
      `)
      .eq('status', 'published')
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (error) throw error
    return data
  }
}

// Lesson queries
export const lessonQueries = {
  // Get lessons by course
  getByCourse: async (courseId) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    return data
  },

  // Get lesson by ID
  getById: async (lessonId) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single()
    
    if (error) throw error
    return data
  },

  // Create lesson
  create: async (lessonData) => {
    const { data, error } = await supabase
      .from('lessons')
      .insert([lessonData])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update lesson
  update: async (lessonId, updates) => {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', lessonId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete lesson
  delete: async (lessonId) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', lessonId)
    
    if (error) throw error
    return true
  },

  // Reorder lessons
  reorder: async (courseId, lessonOrders) => {
    const updates = lessonOrders.map(({ id, order_index }) => ({
      id,
      order_index
    }))

    const { error } = await supabase
      .from('lessons')
      .upsert(updates)
      .eq('course_id', courseId)
    
    if (error) throw error
    return true
  },

  // Get next lesson
  getNextLesson: async (courseId, currentOrderIndex) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .gt('order_index', currentOrderIndex)
      .order('order_index', { ascending: true })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Get previous lesson
  getPreviousLesson: async (courseId, currentOrderIndex) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('course_id', courseId)
      .lt('order_index', currentOrderIndex)
      .order('order_index', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  }
}
