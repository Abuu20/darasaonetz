import { useState } from 'react'
import { supabase } from '../../supabase/client'
import Button from './Button'
import Spinner from './Spinner'

export default function ImageUpload({ 
  onUploadComplete, 
  folder = 'course-thumbnails',
  existingUrl = null,
  label = 'Upload Image',
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(existingUrl)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError('')
    setUploading(true)

    try {
      // Create a preview
      const objectUrl = URL.createObjectURL(file)
      setPreview(objectUrl)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from(folder)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(folder)
        .getPublicUrl(filePath)

      // Callback with the URL
      onUploadComplete(publicUrl, filePath)

    } catch (error) {
      console.error('Error uploading image:', error)
      setError(error.message)
      setPreview(existingUrl)
    } finally {
      setUploading(false)
      // Clear the input
      e.target.value = ''
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploadComplete(null, null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-gray-700 font-medium">{label}</label>}
      
      <div className="flex items-center gap-4">
        {preview ? (
          <div className="relative">
            <img 
              src={preview} 
              alt="Preview" 
              className="w-24 h-24 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded-lg border-2 border-dashed flex items-center justify-center text-gray-400">
            <span className="text-3xl">+</span>
          </div>
        )}
        
        <div className="flex-1">
          <input
            type="file"
            id="file-upload"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className={`inline-block px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {uploading ? 'Uploading...' : 'Choose Image'}
          </label>
          {uploading && <Spinner size="sm" className="ml-2 inline" />}
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          <p className="text-xs text-gray-500 mt-1">
            Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
          </p>
        </div>
      </div>
    </div>
  )
}
