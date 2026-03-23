import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
          courses (
            id,
            title,
            thumbnail_url,
            level,
            teacher_id,
            profiles (
              full_name
            )
          )
        `)
        .eq('student_id', user.id)
        .order('last_accessed', { ascending: false })

      if (error) throw error

      const totalEnrolled = enrollments?.length || 0
      const inProgressCount = enrollments?.filter(e => e.progress > 0 && e.progress < 100).length || 0
      const completedCount = enrollments?.filter(e => e.progress === 100).length || 0

      setStats({
        enrolledCourses: totalEnrolled,
        inProgress: inProgressCount,
        completed: completedCount,
        totalHours: totalEnrolled * 10
      })

      setRecentCourses(enrollments?.slice(0, 3) || [])
      
      setActivities([
        { id: 1, type: 'enrollment', course: 'Quran Basics', time: '2 hours ago' },
        { id: 2, type: 'progress', course: 'Tajweed Rules', progress: 45, time: 'yesterday' },
        { id: 3, type: 'completion', course: 'Arabic Alphabet', time: '3 days ago' }
      ])

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
          Welcome back, {profile?.full_name?.split(' ')[0] || 'Student'}! 👋
        </h1>
        <p className="text-sm sm:text-base text-blue-100">
          Continue your learning journey
        </p>
      </div>

      {/* Stats Grid - Now with dark mode support */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <StatsCard 
          title="Enrolled" 
          value={stats.enrolledCourses}
          icon="📚"
          color="blue"
        />
        <StatsCard 
          title="In Progress" 
          value={stats.inProgress}
          icon="⏳"
          color="green"
        />
        <StatsCard 
          title="Completed" 
          value={stats.completed}
          icon="✅"
          color="purple"
        />
        <StatsCard 
          title="Hours" 
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
            Recommended for You
          </h2>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-4xl mb-2">🔍</p>
            <p className="text-sm">More courses coming soon!</p>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}
