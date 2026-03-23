import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { useCourses } from '../../context/CourseContext'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { validateCourse } from '../../utils/validators'
import { COURSE_LEVELS, COURSE_TYPES, COURSE_STATUS } from '../../utils/constants'
import { Input, Button, Card, Select } from '../ui'
import ImageUpload from '../ui/ImageUpload'

export default function CourseForm({ initialData = null, courseId = null, onSuccess }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { createCourse, updateCourse, categories } = useCourses()
  const { showError, showSuccess } = useTheme()
  
  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    level: initialData?.level || COURSE_LEVELS.BEGINNER,
    price: initialData?.price || '0',
    type: initialData?.type || COURSE_TYPES.ISLAMIC,
    category_id: initialData?.category_id || null, // Change from '' to null
    status: initialData?.status || COURSE_STATUS.DRAFT,
    thumbnail_url: initialData?.thumbnail_url || ''
  })
  
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(!!initialData)

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setIsEditing(true)
    }
  }, [initialData])

  const handleChange = (e) => {
    const { name, value } = e.target
    // Handle category_id specially - if empty string, set to null
    const newValue = name === 'category_id' && value === '' ? null : value
    setFormData(prev => ({ ...prev, [name]: newValue }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleThumbnailUpload = (url) => {
    setFormData(prev => ({ ...prev, thumbnail_url: url }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validation = validateCourse(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    
    try {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

      const courseData = {
        title: formData.title,
        description: formData.description,
        level: formData.level,
        price: parseFloat(formData.price) || 0,
        type: formData.type,
        status: formData.status,
        slug: slug,
        thumbnail_url: formData.thumbnail_url || null,
        enrolled_students: 0, // Explicitly set to 0
        rating: 0
      }

      // Only add category_id if it's a valid UUID (not null)
      if (formData.category_id && formData.category_id !== '') {
        courseData.category_id = formData.category_id
      }

      let result
      if (isEditing && courseId) {
        result = await updateCourse(courseId, courseData)
      } else {
        result = await createCourse(courseData)
      }
      
      if (result.success) {
        showSuccess(isEditing ? 'Course updated successfully!' : 'Course created successfully!')
        
        if (onSuccess) {
          onSuccess(result.data)
        } else {
          setTimeout(() => {
            navigate('/teacher')
          }, 1500)
        }
      } else {
        showError(result.error || (isEditing ? 'Failed to update course' : 'Failed to create course'))
        setErrors({ general: result.error })
      }
    } catch (error) {
      console.error('Error saving course:', error)
      showError('An unexpected error occurred')
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <Card.Header>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </h1>
      </Card.Header>

      <Card.Body>
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Course Title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Quran for Beginners"
            error={errors.title}
            required
            disabled={loading}
          />

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              rows="5"
              placeholder="Describe your course..."
              disabled={loading}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          <ImageUpload
            label="Course Thumbnail"
            onUploadComplete={handleThumbnailUpload}
            folder="course-thumbnails"
            existingUrl={formData.thumbnail_url}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Category"
              name="category_id"
              value={formData.category_id || ''}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select a category (optional)' },
                ...categories.map(cat => ({ 
                  value: cat.id, 
                  label: `${cat.name} (${cat.type})` 
                }))
              ]}
              disabled={loading}
            />

            <Select
              label="Level"
              name="level"
              value={formData.level}
              onChange={handleChange}
              options={[
                { value: COURSE_LEVELS.BEGINNER, label: 'Beginner' },
                { value: COURSE_LEVELS.INTERMEDIATE, label: 'Intermediate' },
                { value: COURSE_LEVELS.ADVANCED, label: 'Advanced' }
              ]}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Course Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={[
                { value: COURSE_TYPES.ISLAMIC, label: 'Islamic' },
                { value: COURSE_TYPES.ACADEMIC, label: 'Academic' }
              ]}
              disabled={loading}
            />

            <Input
              label="Price ($)"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
              error={errors.price}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Status
            </label>
            <div className="flex gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value={COURSE_STATUS.DRAFT}
                  checked={formData.status === COURSE_STATUS.DRAFT}
                  onChange={handleChange}
                  className="mr-2"
                  disabled={loading}
                />
                <span>Save as Draft</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="status"
                  value={COURSE_STATUS.PUBLISHED}
                  checked={formData.status === COURSE_STATUS.PUBLISHED}
                  onChange={handleChange}
                  className="mr-2"
                  disabled={loading}
                />
                <span>Publish Immediately</span>
              </label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditing ? 'Update Course' : 'Create Course'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/teacher')}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card.Body>
    </Card>
  )
}
