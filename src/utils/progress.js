// Calculate course progress based on completed lessons
export const calculateProgress = (completedLessons, totalLessons) => {
  if (!totalLessons || totalLessons === 0) return 0
  return Math.round((completedLessons.length / totalLessons) * 100)
}

// Get total lessons in a course
export const getTotalLessons = (course) => {
  return course.lessons?.length || 0
}

// Get completed lessons for a student in a course
export const getCompletedLessons = async (studentId, courseId) => {
  const { data, error } = await supabase
    .from('lesson_completions')
    .select('lesson_id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
  
  if (error) return []
  return data?.map(c => c.lesson_id) || []
}
