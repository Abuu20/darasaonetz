import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase/client'
import { Card, Input, Select, Spinner, Button } from '../../components/ui'
import RatingStars from '../../components/ui/RatingStars'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function BrowseCourses() {
  const { user } = useAuth()
  const { showSuccess, showError } = useTheme()
  const { t } = useTranslation()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [enrolledCourses, setEnrolledCourses] = useState([])
  const [wishlistItems, setWishlistItems] = useState([])
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
  const [filteredCourses, setFilteredCourses] = useState([])

  useEffect(() => {
    fetchCategories()
    fetchCourses()
    fetchEnrolledCourses()
    fetchWishlist()
  }, [user])

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
      const query = supabase
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
    if (!user) return
    const { data, error } = await supabase
      .from('enrollments')
      .select('course_id')
      .eq('student_id', user.id)
    if (error) throw error
    setEnrolledCourses(data?.map(e => e.course_id) || [])
  }

  async function fetchWishlist() {
    if (!user) return
    const { data, error } = await supabase
      .from('wishlists')
      .select('course_id')
      .eq('student_id', user.id)
    if (error) throw error
    setWishlistItems(data?.map(w => w.course_id) || [])
  }

  async function handleEnroll(courseId) {
    if (!user) {
      window.location.href = '/login'
      return
    }
    try {
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
      showSuccess(t('auth.enrollSuccess') || 'Successfully enrolled!')
      window.location.href = `/student/course/${courseId}`
    } catch (error) {
      console.error('Error enrolling:', error)
      showError(t('auth.enrollFailed') || 'Failed to enroll')
    }
  }

  function handleAddToCart(course) {
    addToCart(course)
    showSuccess(`${course.title} ${t('cart.addedToCart') || 'added to cart'}`)
  }

  async function toggleWishlist(courseId, e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      showError(t('auth.pleaseLoginFirst') || 'Please login first')
      return
    }
    try {
      const isInWishlist = wishlistItems.includes(courseId)
      if (isInWishlist) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseId)
        setWishlistItems(wishlistItems.filter(id => id !== courseId))
        showSuccess(t('student.wishlist.removed') || 'Removed from wishlist')
      } else {
        await supabase
          .from('wishlists')
          .insert({ student_id: user.id, course_id: courseId })
        setWishlistItems([...wishlistItems, courseId])
        showSuccess(t('student.wishlist.added') || 'Added to wishlist')
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      showError(t('common.errorOccurred') || 'An error occurred')
    }
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
        case 'newest': return new Date(b.created_at) - new Date(a.created_at)
        case 'oldest': return new Date(a.created_at) - new Date(b.created_at)
        case 'price-low': return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
        case 'price-high': return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
        case 'rating': return (b.average_rating || 0) - (a.average_rating || 0)
        case 'popular': return (b.enrolled_students || 0) - (a.enrolled_students || 0)
        default: return 0
      }
    })
    setFilteredCourses(filtered)
  }

  const updateFilter = (key, value) => setFilters(prev => ({ ...prev, [key]: value }))
  const resetFilters = () => setFilters({
    search: '', category: '', level: '', type: '', minRating: '', price: 'all', sort: 'newest'
  })

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {t('student.browseCourses.title') || 'Browse Courses'}
        </h1>
        <p className="text-sm md:text-base text-blue-100">
          {t('student.browseCourses.subtitle') || 'Discover the best courses from expert instructors'}
        </p>
      </div>

      {/* Mobile Filter Toggle */}
      <div className="md:hidden">
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline" fullWidth>
          {showFilters ? '▲ Hide Filters' : '▼ Show Filters'}
        </Button>
      </div>

      {/* Filters Section */}
      <div className={showFilters ? 'block' : 'hidden md:block'}>
        <Card className="p-6">
          <div className="space-y-4">
            <Input 
              label={t('student.browseCourses.searchCourses') || 'Search Courses'} 
              value={filters.search} 
              onChange={(e) => updateFilter('search', e.target.value)} 
              placeholder={t('student.browseCourses.searchPlaceholder') || 'Search by title or description...'} 
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select 
                label={t('student.browseCourses.category') || 'Category'} 
                value={filters.category} 
                onChange={(e) => updateFilter('category', e.target.value)} 
                options={[{ value: '', label: t('student.browseCourses.all') || 'All' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} 
              />
              <Select 
                label={t('student.browseCourses.level') || 'Level'} 
                value={filters.level} 
                onChange={(e) => updateFilter('level', e.target.value)} 
                options={[
                  { value: '', label: t('student.browseCourses.all') || 'All' }, 
                  { value: 'beginner', label: t('student.browseCourses.beginner') || 'Beginner' }, 
                  { value: 'intermediate', label: t('student.browseCourses.intermediate') || 'Intermediate' }, 
                  { value: 'advanced', label: t('student.browseCourses.advanced') || 'Advanced' }
                ]} 
              />
              <Select 
                label={t('student.browseCourses.type') || 'Type'} 
                value={filters.type} 
                onChange={(e) => updateFilter('type', e.target.value)} 
                options={[
                  { value: '', label: t('student.browseCourses.all') || 'All' }, 
                  { value: 'islamic', label: t('student.browseCourses.islamic') || 'Islamic Studies' }, 
                  { value: 'academic', label: t('student.browseCourses.academic') || 'Academic' }
                ]} 
              />
              <Select 
                label={t('student.browseCourses.rating') || 'Rating'} 
                value={filters.minRating} 
                onChange={(e) => updateFilter('minRating', e.target.value)} 
                options={[
                  { value: '', label: t('student.browseCourses.any') || 'Any Rating' }, 
                  { value: '4', label: '4★ & Up' }, 
                  { value: '3', label: '3★ & Up' }, 
                  { value: '2', label: '2★ & Up' }
                ]} 
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select 
                label={t('student.browseCourses.price') || 'Price'} 
                value={filters.price} 
                onChange={(e) => updateFilter('price', e.target.value)} 
                options={[
                  { value: 'all', label: t('student.browseCourses.all') || 'All' }, 
                  { value: 'free', label: t('student.browseCourses.free') || 'Free' }, 
                  { value: 'paid', label: t('student.browseCourses.paid') || 'Paid' }
                ]} 
              />
              <Select 
                label={t('student.browseCourses.sortBy') || 'Sort By'} 
                value={filters.sort} 
                onChange={(e) => updateFilter('sort', e.target.value)} 
                options={[
                  { value: 'newest', label: t('student.browseCourses.newest') || 'Newest First' }, 
                  { value: 'price-low', label: t('student.browseCourses.priceLowHigh') || 'Price: Low to High' }, 
                  { value: 'price-high', label: t('student.browseCourses.priceHighLow') || 'Price: High to Low' }, 
                  { value: 'rating', label: t('student.browseCourses.highestRated') || 'Highest Rated' }
                ]} 
              />
            </div>
            {(filters.search || filters.category || filters.level || filters.type || filters.minRating || filters.price !== 'all' || filters.sort !== 'newest') && (
              <div className="flex justify-end">
                <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
                  {t('student.browseCourses.clearAll') || 'Clear All Filters'}
                </button>
              </div>
            )}
            <p className="text-sm text-gray-500">
              {t('student.browseCourses.showing') || 'Showing'} {filteredCourses.length} {t('student.browseCourses.of') || 'of'} {courses.length} {t('student.browseCourses.courses') || 'courses'}
            </p>
          </div>
        </Card>
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const isEnrolled = enrolledCourses.includes(course.id)
            const isInWishlist = wishlistItems.includes(course.id)
            const avgRating = course.average_rating || 0
            const reviewCount = course.review_count || 0
            
            return (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 group relative">
                {/* Wishlist Heart Button */}
                <button
                  onClick={(e) => toggleWishlist(course.id, e)}
                  className={`absolute top-3 right-3 z-10 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md transition-all hover:scale-110 ${
                    isInWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                  aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <svg className="w-5 h-5" fill={isInWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>

                {/* Course Image Link - Goes to Preview/Details Page */}
                <Link to={`/student/course-details/${course.id}`}>
                  <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-500 relative overflow-hidden">
                    {course.thumbnail_url ? (
                      <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-5xl">📚</div>
                    )}
                    {avgRating > 0 && (
                      <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <RatingStars rating={avgRating} readonly size="sm" />
                        <span className="text-xs text-white ml-1">({reviewCount})</span>
                      </div>
                    )}
                    {course.price > 0 ? (
                      <div className="absolute bottom-3 left-3 bg-blue-600 rounded-full px-3 py-1">
                        <span className="text-white text-sm font-semibold">TZS {course.price.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="absolute bottom-3 left-3 bg-green-600 rounded-full px-3 py-1">
                        <span className="text-white text-sm font-semibold">Free</span>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-5">
                  {/* Course Title Link - Goes to Preview/Details Page */}
                  <Link to={`/student/course-details/${course.id}`}>
                    <h3 className="font-bold text-lg mb-2 line-clamp-1 hover:text-blue-600 transition">{course.title}</h3>
                  </Link>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      <RatingStars rating={avgRating} readonly size="sm" />
                      {reviewCount > 0 && <span className="text-xs text-gray-500">({reviewCount})</span>}
                    </div>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500 capitalize">{course.level || 'Beginner'}</span>
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{course.description || 'No description available'}</p>

                  {/* Instructor & Lessons */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
                        {course.profiles?.full_name?.charAt(0) || 'T'}
                      </div>
                      <span className="text-xs text-gray-500 truncate max-w-[100px]">
                        {course.profiles?.full_name?.split(' ')[0] || 'Instructor'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">📚 {course.lessons?.count || 0} lessons</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 items-center">
                    {/* View Details Button - Always goes to Preview Page */}
                    <Link 
                      to={`/student/course-details/${course.id}`} 
                      className="flex-1 text-center bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
                    >
                      View Details
                    </Link>
                    
                    {isEnrolled ? (
                      /* If enrolled, go to Learning View */
                      <Link 
                        to={`/student/course/${course.id}`} 
                        className="flex-1 text-center bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
                      >
                        Continue Learning
                      </Link>
                    ) : course.price > 0 ? (
                      /* Paid course - Add to Cart */
                      <button 
                        onClick={() => handleAddToCart(course)} 
                        className="p-2 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors"
                        title="Add to Cart"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </button>
                    ) : (
                      /* Free course - Enroll Now */
                      <button 
                        onClick={() => handleEnroll(course.id)} 
                        className="flex-1 text-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
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
          <div className="text-center py-12">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500">{t('student.browseCourses.noCoursesFound') || 'No courses found'}</p>
            <button onClick={resetFilters} className="mt-4 text-blue-600 hover:underline">
              {t('student.browseCourses.clearAll') || 'Clear all filters'}
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}