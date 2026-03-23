import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Input, Select, Spinner, Button } from '../../components/ui'
import CourseCard from '../../components/courses/CourseCard'
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
      alert('Successfully enrolled in course!')

    } catch (error) {
      console.error('Error enrolling:', error)
      alert('Failed to enroll. Please try again.')
    }
  }

  function handleAddToCart(course) {
    addToCart(course)
    alert(`${course.title} added to cart!`)
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
      filtered = filtered.filter(course => course.price === 0 || !course.price)
    } else if (filters.price === 'paid') {
      filtered = filtered.filter(course => course.price > 0)
    }

    filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at)
        case 'price-low':
          return (a.price || 0) - (b.price || 0)
        case 'price-high':
          return (b.price || 0) - (a.price || 0)
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
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 md:p-6 text-white">
        <h1 className="text-xl md:text-2xl font-bold mb-1">Browse Courses</h1>
        <p className="text-sm text-blue-100">Discover Islamic courses from expert teachers</p>
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
        <Card>
          <div className="space-y-3">
            <Input
              label="Search Courses"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              placeholder="Search by title or description..."
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map(course => {
            const isEnrolled = enrolledCourses.includes(course.id)
            
            return (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                {/* Course Thumbnail */}
                <div className="h-36 sm:h-40 md:h-48 bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-3xl relative">
                  {course.thumbnail_url ? (
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  ) : (
                    '📚'
                  )}
                  {course.average_rating > 0 && (
                    <div className="absolute top-2 right-2 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                      <RatingStars rating={course.average_rating} readonly size="sm" />
                      <span className="text-xs text-white ml-1">
                        ({course.review_count})
                      </span>
                    </div>
                  )}
                </div>

                {/* Course Content */}
                <div className="p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded capitalize">
                      {course.level}
                    </span>
                    {course.categories && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                        {course.categories.name}
                      </span>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm sm:text-base mb-1 line-clamp-1">{course.title}</h3>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <RatingStars rating={course.average_rating} readonly size="sm" />
                    {course.review_count > 0 && (
                      <span className="text-xs text-gray-500">({course.review_count})</span>
                    )}
                  </div>

                  <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2">
                    {course.description}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>👤 {course.profiles?.full_name?.split(' ')[0] || 'Instructor'}</span>
                    <span>📚 {course.lessons?.count || 0} lessons</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      {course.price > 0 ? (
                        <span className="text-lg sm:text-xl font-bold text-blue-600">
                          TZS {course.price.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-lg sm:text-xl font-bold text-green-600">
                          Free
                        </span>
                      )}
                    </div>
                    
                    {isEnrolled ? (
                      <Link
                        to={`/student/course/${course.id}`}
                        className="bg-green-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-green-700"
                      >
                        Continue
                      </Link>
                    ) : course.price > 0 ? (
                      <button
                        onClick={() => handleAddToCart(course)}
                        className="bg-yellow-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-yellow-700"
                      >
                        Add to Cart
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="bg-blue-600 text-white px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm hover:bg-blue-700"
                      >
                        Enroll Free
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <div className="text-center py-8">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500">No courses found</p>
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
