import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'

export default function WishlistButton({ courseId, onToggle }) {
  const { user } = useAuth()
  const { showError, showSuccess } = useTheme()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      checkWishlistStatus()
    }
  }, [user, courseId])

  async function checkWishlistStatus() {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .single()

      setIsInWishlist(!!data)
    } catch (error) {
      if (error.code !== 'PGRST116') {
        console.error('Error checking wishlist:', error)
      }
    }
  }

  async function handleToggle() {
    if (!user) {
      showError('Please login to add courses to wishlist')
      return
    }

    setLoading(true)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlists')
          .delete()
          .eq('student_id', user.id)
          .eq('course_id', courseId)

        if (error) throw error
        setIsInWishlist(false)
        showSuccess('Removed from wishlist')
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlists')
          .insert({
            student_id: user.id,
            course_id: courseId
          })

        if (error) throw error
        setIsInWishlist(true)
        showSuccess('Added to wishlist')
      }
      
      if (onToggle) onToggle()
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      showError('Failed to update wishlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isInWishlist 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-400 hover:text-red-500'
      }`}
      aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <svg 
        className="w-6 h-6" 
        fill={isInWishlist ? 'currentColor' : 'none'} 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
        />
      </svg>
    </button>
  )
}
