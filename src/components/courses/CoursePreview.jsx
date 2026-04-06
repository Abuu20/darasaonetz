// src/components/courses/CoursePreview.jsx
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Avatar, Spinner } from '../ui'
import RatingStars from '../ui/RatingStars'
import VideoPlayer from './VideoPlayer'
import MaterialViewer from './MaterialViewer'

export default function CoursePreview({ courseId, isTeacher = false }) {
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lessons, setLessons] = useState([])
  const [expandedLesson, setExpandedLesson] = useState(null)
  const [previewLesson, setPreviewLesson] = useState(null)
  const [reviews, setReviews] = useState([])
  const [instructor, setInstructor] = useState(null)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [whatYoullLearn, setWhatYoullLearn] = useState([])

  useEffect(() => {
    fetchPreviewData()
  }, [courseId])

  async function fetchPreviewData() {
    try {
      setLoading(true)
      
      // Fetch course with lessons
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select(`
          *,
          categories (id, name),
          lessons (
            id,
            title,
            description,
            duration,
            is_free,
            order_index,
            video_url,
            content
          )
        `)
        .eq('id', courseId)
        .single()

      if (courseError) throw courseError
      setCourse(courseData)
      
      // Sort lessons by order_index
      const sortedLessons = (courseData.lessons || []).sort((a, b) => a.order_index - b.order_index)
      setLessons(sortedLessons)
      
      // Set first free lesson as preview if available
      const firstFreeLesson = sortedLessons.find(l => l.is_free === true)
      if (firstFreeLesson) {
        setPreviewLesson(firstFreeLesson)
      } else if (sortedLessons.length > 0) {
        setPreviewLesson(sortedLessons[0])
      }
      
      // Fetch instructor
      if (courseData.teacher_id) {
        const { data: teacherData } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url, bio, expertise, qualifications')
          .eq('id', courseData.teacher_id)
          .single()
        
        if (teacherData) setInstructor(teacherData)
      }
      
      // Fetch reviews
      const { data: reviewsData } = await supabase
        .from('course_reviews')
        .select(`
          *,
          profiles:student_id (full_name, avatar_url)
        `)
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })
        .limit(5)
      
      setReviews(reviewsData || [])
      
      // Generate "What You'll Learn" from lessons
      const learningPoints = []
      sortedLessons.forEach(lesson => {
        if (lesson.title && !learningPoints.includes(lesson.title)) {
          learningPoints.push(lesson.title)
        }
      })
      
      if (courseData.type === 'islamic') {
        learningPoints.unshift('Understand the fundamentals of Islamic teachings')
        learningPoints.push('Learn proper Quran recitation with Tajweed')
        learningPoints.push('Study authentic Hadith and Islamic jurisprudence')
      } else {
        learningPoints.unshift('Master core concepts and principles')
        learningPoints.push('Apply knowledge through practical exercises')
        learningPoints.push('Develop critical thinking skills')
      }
      
      setWhatYoullLearn(learningPoints.slice(0, 6))
      
    } catch (error) {
      console.error('Error fetching preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAverageRating = () => {
    if (!reviews.length) return 0
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return sum / reviews.length
  }

  const averageRating = calculateAverageRating()
  const totalDuration = lessons.reduce((sum, l) => sum + (l.duration || 0), 0)
  const videoLessons = lessons.filter(l => l.video_url).length
  const freeLessons = lessons.filter(l => l.is_free).length
  const instructorName = instructor?.full_name || course?.teacher_name || 'Instructor'
  const instructorInitial = instructorName.charAt(0).toUpperCase()

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">{course?.title}</h1>
            <p className="text-blue-100 mb-4">{course?.description}</p>
            
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1">
                <span>⭐</span>
                <span>{averageRating.toFixed(1)}</span>
                <span className="text-blue-200">({reviews.length} reviews)</span>
              </div>
              <div>📚 {lessons.length} lessons</div>
              <div>⏱️ {Math.floor(totalDuration / 60)}h {totalDuration % 60}m total</div>
              <div>🎥 {videoLessons} videos</div>
              <div className="capitalize">📊 {course?.level || 'Beginner'}</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-center min-w-[200px]">
            {course?.price > 0 ? (
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                TZS {course.price.toLocaleString()}
              </div>
            ) : (
              <div className="text-2xl font-bold text-green-600">Free</div>
            )}
            
            {isTeacher ? (
              <div className="mt-4">
                <div className="text-sm text-gray-500 mb-2">Teacher Preview Mode</div>
                <Button variant="outline" fullWidth disabled>
                  {isEnrolled ? 'Enrolled' : 'Preview Mode'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2 mt-4">
                <Link to={`/student/course-details/${courseId}`}>
                  <Button variant="primary" fullWidth>
                    View Full Details
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Preview Video / Material */}
          {previewLesson && (
            <Card>
              <Card.Header>
                <h2 className="text-xl font-semibold">Course Preview: {previewLesson.title}</h2>
                {previewLesson.is_free && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Free Preview</span>
                )}
              </Card.Header>
              <Card.Body>
                {previewLesson.video_url ? (
                  previewLesson.video_url.includes('youtube.com') || previewLesson.video_url.includes('vimeo.com') ? (
                    <VideoPlayer 
                      videoUrl={previewLesson.video_url}
                      title={previewLesson.title}
                      showControls={true}
                    />
                  ) : previewLesson.video_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <MaterialViewer url={previewLesson.video_url} title={previewLesson.title} />
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                      <p className="text-gray-500">Preview material available</p>
                      <a href={previewLesson.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-2 inline-block">
                        Click to view material →
                      </a>
                    </div>
                  )
                ) : previewLesson.content ? (
                  <div 
                    className="prose max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: previewLesson.content.substring(0, 500) + (previewLesson.content.length > 500 ? '...' : '') }}
                  />
                ) : (
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <p className="text-gray-500">No preview content available for this lesson</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          )}

          {/* What You'll Learn */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">What You'll Learn</h2>
            </Card.Header>
            <Card.Body>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {whatYoullLearn.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="text-green-500 text-lg">✓</span>
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Course Content */}
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center flex-wrap">
                <div>
                  <h2 className="text-xl font-semibold">Course Content</h2>
                  <p className="text-sm text-gray-500">
                    {lessons.length} lessons • {freeLessons} free preview lessons
                  </p>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="space-y-2">
                {lessons.map((lesson, idx) => (
                  <div 
                    key={lesson.id} 
                    className={`border rounded-lg p-4 transition ${expandedLesson === lesson.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                  >
                    <div 
                      className="flex items-center justify-between cursor-pointer"
                      onClick={() => setExpandedLesson(expandedLesson === lesson.id ? null : lesson.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-gray-400 w-8 text-sm">{idx + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{lesson.title}</p>
                            {lesson.is_free && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                                Free Preview
                              </span>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="text-xs text-gray-500 line-clamp-1 mt-1">{lesson.description}</p>
                          )}
                        </div>
                        {lesson.duration && (
                          <span className="text-xs text-gray-400">{lesson.duration} min</span>
                        )}
                        <span className="text-gray-400 text-sm">
                          {expandedLesson === lesson.id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Expanded Lesson Preview */}
                    {expandedLesson === lesson.id && (
                      <div className="mt-4 pt-4 border-t">
                        {lesson.is_free ? (
                          <>
                            {lesson.video_url && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                                {lesson.video_url.includes('youtube.com') || lesson.video_url.includes('vimeo.com') ? (
                                  <VideoPlayer videoUrl={lesson.video_url} title={lesson.title} />
                                ) : lesson.video_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                  <img src={lesson.video_url} alt={lesson.title} className="max-w-full rounded-lg" />
                                ) : (
                                  <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    View Material →
                                  </a>
                                )}
                              </div>
                            )}
                            {lesson.content && (
                              <div 
                                className="prose prose-sm max-w-none dark:prose-invert"
                                dangerouslySetInnerHTML={{ __html: lesson.content.substring(0, 300) + (lesson.content.length > 300 ? '...' : '') }}
                              />
                            )}
                          </>
                        ) : (
                          <div className="text-center py-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <p className="text-gray-500">🔒 This lesson is only available after enrollment</p>
                            {!isTeacher && (
                              <Link to={`/student/course-details/${courseId}`}>
                                <Button variant="primary" size="sm" className="mt-2">
                                  Enroll to Access
                                </Button>
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card.Body>
          </Card>

          {/* Reviews Preview */}
          <Card>
            <Card.Header>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Student Reviews</h2>
                <div className="flex items-center gap-2">
                  <RatingStars rating={averageRating} readonly />
                  <span className="text-gray-600">({reviews.length})</span>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 3).map((review, idx) => (
                    <div key={idx} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar src={review.profiles?.avatar_url} size="sm" />
                        <div>
                          <p className="font-medium text-sm">{review.profiles?.full_name || 'Anonymous'}</p>
                          <RatingStars rating={review.rating} readonly size="sm" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(review.created_at).toLocaleDateString()}</p>
                    </div>
                  ))}
                  {reviews.length > 3 && (
                    <div className="text-center pt-2">
                      <Link to={`/student/course-details/${courseId}#reviews`}>
                        <Button variant="outline" size="sm">View All {reviews.length} Reviews</Button>
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No reviews yet. Be the first to review!</p>
              )}
            </Card.Body>
          </Card>
        </div>

        {/* Right Column - Instructor Info */}
        <div className="space-y-6">
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">About the Instructor</h2>
            </Card.Header>
            <Card.Body className="text-center">
              {instructor?.avatar_url ? (
                <img 
                  src={instructor.avatar_url} 
                  alt={instructor.full_name || 'Instructor'}
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-blue-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 mx-auto mb-3 flex items-center justify-center text-white text-3xl font-bold">
                  {instructorInitial}
                </div>
              )}
              
              <h3 className="font-semibold text-lg">{instructorName}</h3>
              
              {instructor?.email && (
                <p className="text-sm text-gray-500 mt-1">{instructor.email}</p>
              )}
              
              {instructor?.expertise && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">Expertise</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{instructor.expertise}</p>
                </div>
              )}
              
              {instructor?.bio && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 font-semibold mb-1">About</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-left line-clamp-3">{instructor.bio}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Course Stats */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">Course Statistics</h2>
            </Card.Header>
            <Card.Body className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">📊 Total Lessons</span>
                <span className="font-semibold">{lessons.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🎥 Video Content</span>
                <span className="font-semibold">{videoLessons} videos</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">⏱️ Total Duration</span>
                <span className="font-semibold">{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">🔓 Free Previews</span>
                <span className="font-semibold">{freeLessons} lessons</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">⭐ Average Rating</span>
                <span className="font-semibold">{averageRating.toFixed(1)} / 5</span>
              </div>
            </Card.Body>
          </Card>

          {/* What's Included */}
          <Card>
            <Card.Header>
              <h2 className="text-xl font-semibold">What's Included</h2>
            </Card.Header>
            <Card.Body className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm">Full lifetime access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm">Certificate of completion</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm">Mobile and TV access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm">Discussion forum access</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✓</span>
                <span className="text-sm">Quizzes and assignments</span>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  )
}