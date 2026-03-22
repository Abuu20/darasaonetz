import { supabase } from '../client'

export const certificateQueries = {
  // Generate unique certificate number
  generateCertificateNumber: (studentId, courseId) => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const studentPart = studentId.slice(0, 8).toUpperCase()
    const coursePart = courseId.slice(0, 8).toUpperCase()
    return `DAR-${studentPart}-${coursePart}-${timestamp}`
  },

  // Generate verification token
  generateVerificationToken: () => {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15)
  },

  // Issue certificate for a completed course
  issueCertificate: async (studentId, courseId) => {
    // Check if certificate already exists
    const { data: existing } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .maybeSingle()

    if (existing) {
      return existing
    }

    const certificateNumber = certificateQueries.generateCertificateNumber(studentId, courseId)
    const verificationToken = certificateQueries.generateVerificationToken()

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        course_id: courseId,
        certificate_number: certificateNumber,
        verification_token: verificationToken,
        issue_date: new Date().toISOString(),
        download_count: 0,
        share_count: 0
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get student's certificates
  getStudentCertificates: async (studentId) => {
    const { data, error } = await supabase
      .from('certificates')
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
          profiles:teacher_id (
            id,
            full_name,
            email,
            avatar_url
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('is_valid', true)
      .order('issue_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get certificate by ID
  getCertificateById: async (certificateId) => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (
          id,
          title,
          description,
          level,
          price,
          profiles:teacher_id (
            id,
            full_name,
            email,
            avatar_url,
            bio
          )
        ),
        profiles:student_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('id', certificateId)
      .single()

    if (error) throw error
    return data
  },

  // Get all certificates for a course (teacher view)
  getCourseCertificates: async (courseId) => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        profiles:student_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('course_id', courseId)
      .eq('is_valid', true)
      .order('issue_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get all certificates for a teacher (all their courses)
  getTeacherCertificates: async (teacherId) => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (
          id,
          title,
          profiles:teacher_id (
            full_name
          )
        ),
        profiles:student_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .in('course_id', supabase
        .from('courses')
        .select('id')
        .eq('teacher_id', teacherId)
      )
      .eq('is_valid', true)
      .order('issue_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get all certificates (admin view)
  getAllCertificates: async () => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (
          id,
          title,
          profiles:teacher_id (
            full_name
          )
        ),
        profiles:student_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('is_valid', true)
      .order('issue_date', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get certificate statistics for teacher dashboard
  getTeacherCertificateStats: async (teacherId) => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses!inner (
          teacher_id
        )
      `)
      .eq('courses.teacher_id', teacherId)
      .eq('is_valid', true)

    if (error) throw error
    
    const byCourse = {}
    data?.forEach(cert => {
      const courseId = cert.course_id
      if (!byCourse[courseId]) {
        byCourse[courseId] = {
          courseId: courseId,
          count: 0
        }
      }
      byCourse[courseId].count++
    })

    return {
      total: data?.length || 0,
      byCourse: Object.values(byCourse)
    }
  },

  // Verify certificate by token
  verifyCertificate: async (token) => {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        courses (
          id,
          title,
          profiles:teacher_id (
            full_name
          )
        ),
        profiles:student_id (
          id,
          full_name,
          email
        )
      `)
      .eq('verification_token', token)
      .eq('is_valid', true)
      .maybeSingle()

    if (error) throw error
    return data
  },

  // Increment download count
  incrementDownloadCount: async (certificateId) => {
    const { data: current } = await supabase
      .from('certificates')
      .select('download_count')
      .eq('id', certificateId)
      .single()
    
    if (current) {
      const { error } = await supabase
        .from('certificates')
        .update({ download_count: (current.download_count || 0) + 1 })
        .eq('id', certificateId)
      
      if (error) throw error
    }
    return true
  },

  // Increment share count
  incrementShareCount: async (certificateId) => {
    const { data: current } = await supabase
      .from('certificates')
      .select('share_count')
      .eq('id', certificateId)
      .single()
    
    if (current) {
      const { error } = await supabase
        .from('certificates')
        .update({ share_count: (current.share_count || 0) + 1 })
        .eq('id', certificateId)
      
      if (error) throw error
    }
    return true
  },

  // Check if student has certificate for course
  hasCertificate: async (studentId, courseId) => {
    const { data, error } = await supabase
      .from('certificates')
      .select('id')
      .eq('student_id', studentId)
      .eq('course_id', courseId)
      .eq('is_valid', true)
      .maybeSingle()

    if (error) throw error
    return !!data
  }
}
