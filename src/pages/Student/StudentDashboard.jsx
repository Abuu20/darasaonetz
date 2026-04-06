import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Card, Spinner } from '../../components/ui'
import StatsCard from '../../components/dashboard/StatsCard'
import RecentCourses from '../../components/dashboard/RecentCourses'
import ActivityFeed from '../../components/dashboard/ActivityFeed'

export default function StudentDashboard() {
  const { user, profile } = useAuth()
  const { isMobile } = useTheme()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    inProgress: 0,
    completed: 0,
    totalHours: 0
  })
  const [recentCourses, setRecentCourses] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      if (!user) return

      const { data: enrollments, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner (
            id,
            title,
            thumbnail_url,
            level,
            teacher_id,
            price,
            status,
            profiles (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('last_accessed', { ascending: false })

      if (error) throw error

      const validEnrollments = enrollments?.filter(e => e.courses !== null && e.courses.status === 'published') || []
      
      const totalEnrolled = validEnrollments.length
      const inProgressCount = validEnrollments.filter(e => e.progress > 0 && e.progress < 100).length || 0
      const completedCount = validEnrollments.filter(e => e.progress === 100).length || 0

      setStats({
        enrolledCourses: totalEnrolled,
        inProgress: inProgressCount,
        completed: completedCount,
        totalHours: totalEnrolled * 10
      })

      setRecentCourses(validEnrollments.slice(0, 3) || [])
      
      const { data: completions } = await supabase
        .from('lesson_completions')
        .select(`
          *,
          lessons (
            title,
            courses (
              title,
              status
            )
          )
        `)
        .eq('student_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5)

      const activityList = []
      
      validEnrollments.forEach(enrollment => {
        if (enrollment.enrolled_at && enrollment.courses) {
          activityList.push({
            id: `enroll-${enrollment.id}`,
            type: 'enrollment',
            course: enrollment.courses?.title,
            time: enrollment.enrolled_at
          })
        }
      })
      
      completions?.forEach(completion => {
        if (completion.completed_at && completion.lessons?.courses?.status === 'published') {
          activityList.push({
            id: `complete-${completion.id}`,
            type: 'progress',
            course: completion.lessons?.courses?.title,
            lesson: completion.lessons?.title,
            time: completion.completed_at
          })
        }
      })
      
      activityList.sort((a, b) => new Date(b.time) - new Date(a.time))
      setActivities(activityList.slice(0, 5))

    } catch (error) {
      console.error('Error fetching dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-6 md:p-8 text-white">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
          {t('student.dashboard.welcome')}, {profile?.full_name?.split(' ')[0] || 'Student'}{t('student.dashboard.welcomeSuffix')}
        </h1>
        <p className="text-sm sm:text-base text-blue-100">
          {t('student.dashboard.continueJourney')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatsCard 
          title={t('student.dashboard.enrolled')} 
          value={stats.enrolledCourses}
          icon="📚"
          color="blue"
        />
        <StatsCard 
          title={t('student.dashboard.inProgress')} 
          value={stats.inProgress}
          icon="⏳"
          color="green"
        />
        <StatsCard 
          title={t('student.dashboard.completed')} 
          value={stats.completed}
          icon="✅"
          color="purple"
        />
        <StatsCard 
          title={t('student.dashboard.hours')} 
          value={stats.totalHours}
          icon="⏰"
          color="orange"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2">
          <RecentCourses courses={recentCourses} />
        </div>
        <div>
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Recommended Courses */}
      <Card>
        <Card.Header>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
            {t('student.dashboard.recommended')}
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">{t('student.dashboard.comingSoon')}</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}