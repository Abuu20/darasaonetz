import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Input, Select, Spinner, Button } from '../../components/ui'
import BeautifulCard from '../../components/ui/BeautifulCard'
import RatingStars from '../../components/ui/RatingStars'
import { useCart } from '../../context/CartContext'

export default function BrowseCourses() {
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const { addToCart } = useCart()
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    type: '',
    minRating: '',
    price: 'all',
    sort: 'newest'
  })

  useEffect(() => {
    fetchCategories()
    fetchCourses()
    fetchEnrolledCourses()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, courses])

  async function fetchCategories() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      
      if (error) throw error
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function fetchCourses() {
    try {
      let query = supabase
        .from('courses')
        .select(`
          *,
          categories (
            id,
            name
          ),
          profiles (
            full_name,
            avatar_url
          ),
          course_reviews (
            rating
          ),
          lessons (count)
        `)
        .eq('status', 'published')
        .order('created_at', { ascending: false })

      const { data, error } = await query
      
      if (error) throw error
      
      const coursesWithRatings = data?.map(course => {
        const reviews = course.course_reviews || []
        const avgRating = reviews.length > 0 
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
          : 0
        return {
          ...course,
          average_rating: avgRating,
          review_count: reviews.length
        }
      }) || []
      
      setCourses(coursesWithRatings)
    } catch (error) {
      console.error('Error fetching courses:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchEnrolledCourses() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user.id)

      if (error) throw error
      setEnrolledCourses(data?.map(e => e.course_id) || [])
    } catch (error) {
      console.error('Error fetching enrolled courses:', error)
    }
  }

  async function handleEnroll(courseId) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      const { error } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          progress: 0,
          completed_lessons: []
        })

      if (error) throw error

      setEnrolledCourses([...enrolledCourses, courseId])
      alert('🎉 Successfully enrolled in course!')

    } catch (error) {
      console.error('Error enrolling:', error)
      alert('Failed to enroll. Please try again.')
    }
  }

  function handleAddToCart(course) {
    addToCart(course)
    alert(`🛒 ${course.title} added to cart!`)
  }

  function applyFilters() {
    let filtered = [...courses]

    if (filters.search) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        course.description?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    if (filters.category) {
      filtered = filtered.filter(course => course.category_id === filters.category)
    }

    if (filters.level) {
      filtered = filtered.filter(course => course.level === filters.level)
    }

    if (filters.type) {
      filtered = filtered.filter(course => course.type === filters.type)
    }

    if (filters.minRating) {
      filtered = filtered.filter(course => course.average_rating >= parseInt(filters.minRating))
    }

    if (filters.price === 'free') {
      filtered = filtered.filter(course => parseFloat(course.price) === 0 || !course.price)
    } else if (filters.price === 'paid') {
      filtered = filtered.filter(course => parseFloat(course.price) > 0)
    }

    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'price-low':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
        case 'price-high':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
        case 'rating':
          return (b.average_rating || 0) - (a.average_rating || 0)
        case 'popular':
          return (b.enrolled_students || 0) - (a.enrolled_students || 0)
        default:
          return 0
      }
    })

    setFilteredCourses(filtered)
  }

  const [filteredCourses, setFilteredCourses] = useState([])

  useEffect(() => {
    applyFilters()
  }, [filters, courses])

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters({
      search: '',
      category: '',
      level: '',
      type: '',
      minRating: '',
      price: 'all',
      sort: 'newest'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Discover Amazing Courses</h1>
        <p className="text-sm md:text-base text-blue-100">
          Learn from expert teachers around the world
        </p>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden">
        <Button 
          onClick={() => setShowFilters(!showFilters)} 
          variant="outline" 
          fullWidth
          className="flex items-center justify-center gap-2"
        >
          <span>{showFilters ? '▲' : '▼'}</span>
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      {/* Filters Section */}
      <div className={`${showFilters ? 'block' : 'hidden md:block'}`}>
        <Card className="p-6">
          <div className="space-y-4">
            <Input
              label="Search Courses"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by title or description..."
              className="w-full"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select
                label="Category"
                value={filters.category}
                onChange={(e) => updateFilter('category', e.target.value)}
                options={[
                  { value: '', label: 'All Categories' },
                  ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                ]}
              />

              <Select
                label="Level"
                value={filters.level}
                onChange={(e) => updateFilter('level', e.target.value)}
                options={[
                  { value: '', label: 'All Levels' },
                  { value: 'beginner', label: 'Beginner' },
                  { value: 'intermediate', label: 'Intermediate' },
                  { value: 'advanced', label: 'Advanced' }
                ]}
              />

              <Select
                label="Course Type"
                value={filters.type}
                onChange={(e) => updateFilter('type', e.target.value)}
                options={[
                  { value: '', label: 'All Types' },
                  { value: 'islamic', label: 'Islamic' },
                  { value: 'academic', label: 'Academic' }
                ]}
              />

              <Select
                label="Minimum Rating"
                value={filters.minRating}
                onChange={(e) => updateFilter('minRating', e.target.value)}
                options={[
                  { value: '', label: 'Any Rating' },
                  { value: '4', label: '4★ & above' },
                  { value: '3', label: '3★ & above' },
                  { value: '2', label: '2★ & above' }
                ]}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Price"
                value={filters.price}
                onChange={(e) => updateFilter('price', e.target.value)}
                options={[
                  { value: 'all', label: 'All Courses' },
                  { value: 'free', label: 'Free Only' },
                  { value: 'paid', label: 'Paid Only' }
                ]}
              />

              <Select
                label="Sort By"
                value={filters.sort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                options={[
                  { value: 'newest', label: 'Newest First' },
                  { value: 'oldest', label: 'Oldest First' },
                  { value: 'price-low', label: 'Price: Low to High' },
                  { value: 'price-high', label: 'Price: High to Low' },
                  { value: 'rating', label: 'Highest Rated' },
                  { value: 'popular', label: 'Most Popular' }
                ]}
              />
            </div>

            {(filters.search || filters.category || filters.level || filters.type || filters.minRating || filters.price !== 'all' || filters.sort !== 'newest') && (
              <div className="flex justify-end">
                <button
                  onClick={resetFilters}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            )}

            <p className="text-sm text-gray-500">
              Showing {filteredCourses.length} of {courses.length} courses
            </p>
          </div>
        </Card>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => (
            <BeautifulCard
              key={course.id}
              course={course}
              isEnrolled={enrolledCourses.includes(course.id)}
              onEnroll={handleEnroll}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500 text-lg">No courses found</p>
            <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</p>
            <button
              onClick={resetFilters}
              className="mt-4 text-blue-600 hover:underline text-sm"
            >
              Clear all filters
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
