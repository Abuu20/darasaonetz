import { supabase } from '../client'

export const quizQueries = {
  // Get quiz by ID with questions and options
  getQuizById: async (quizId) => {
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', quizId)
      .single()
    
    if (error) throw error
    return data
  },

  // Get questions for a quiz
  getQuestions: async (quizId) => {
    const { data, error } = await supabase
      .from('quiz_questions')
      .select(`
        *,
        options:quiz_options (*)
      `)
      .eq('quiz_id', quizId)
      .order('order_index')
    
    if (error) throw error
    return data || []
  },

  // Get student's attempts for a quiz
  getStudentAttempts: async (quizId, studentId) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Get in-progress attempt (not completed)
  getInProgressAttempt: async (quizId, studentId) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .is('completed_at', null)
      .maybeSingle()
    
    if (error) throw error
    return data
  },

  // Get answers for an attempt
  getAnswersForAttempt: async (attemptId) => {
    const { data, error } = await supabase
      .from('quiz_answers')
      .select('*')
      .eq('attempt_id', attemptId)
    
    if (error) throw error
    return data || []
  },

  // Create new attempt
  createAttempt: async (quizId, studentId) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert({
        quiz_id: quizId,
        student_id: studentId,
        started_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Save answers for an attempt
  saveAnswers: async (attemptId, answers) => {
    // First delete existing answers
    await supabase
      .from('quiz_answers')
      .delete()
      .eq('attempt_id', attemptId)
    
    // Insert new answers
    if (answers.length > 0) {
      const { error } = await supabase
        .from('quiz_answers')
        .insert(answers)
      
      if (error) throw error
    }
    
    return true
  },

  // Complete attempt with score
  completeAttempt: async (attemptId, score, passed, timeSpent) => {
    const { error } = await supabase
      .from('quiz_attempts')
      .update({
        score: score,
        passed: passed,
        completed_at: new Date().toISOString(),
        time_spent: timeSpent
      })
      .eq('id', attemptId)
    
    if (error) throw error
    return true
  },

  // Get completed attempts count
  getCompletedAttemptsCount: async (quizId, studentId) => {
    const { count, error } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true })
      .eq('quiz_id', quizId)
      .eq('student_id', studentId)
      .not('completed_at', 'is', null)
    
    if (error) throw error
    return count || 0
  }
}
