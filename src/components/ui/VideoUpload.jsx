import { useState } from 'react'
import { supabase } from '../../supabase/client'
import Button from './Button'
import Spinner from './Spinner'

export default function VideoUpload({ 
  onUploadComplete, 
  courseId,
  existingUrl = null,
  label = 'Upload Video',
  className = ''
}) {
  const [uploading, setUploading] = useState(false)
  const [videoUrl, setVideoUrl] = useState(existingUrl)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please upload a video file')
      return
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setError('File size must be less than 100MB')
      return
    }

    setError('')
    setUploading(true)
    setProgress(0)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')
      if (!courseId) throw new Error('Course ID is required')

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${courseId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${fileName}`

      // Upload to Supabase Storage with progress tracking
      const { error: uploadError, data } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100
            setProgress(Math.round(percent))
          }
        })

      if (uploadError) throw uploadError

      // Get the URL (not public, will be accessed via signed URL)
      const { data: { publicUrl } } = supabase.storage
        .from('lesson-videos')
        .getPublicUrl(filePath)

      setVideoUrl(publicUrl)
      onUploadComplete(publicUrl, filePath)

    } catch (error) {
      console.error('Error uploading video:', error)
      setError(error.message)
    } finally {
      setUploading(false)
      setProgress(0)
      // Clear the input
      e.target.value = ''
    }
  }

  const handleRemove = () => {
    setVideoUrl(null)
    onUploadComplete(null, null)
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="block text-gray-700 font-medium">{label}</label>}
      
      <div className="space-y-3">
        {videoUrl ? (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 p-2 rounded">
              <span className="text-sm text-gray-600 truncate block">
                {videoUrl.split('/').pop()}
              </span>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="text-red-500 hover:text-red-700"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <input
              type="file"
              id="video-upload"
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploading}
            />
            <label
              htmlFor="video-upload"
              className={`cursor-pointer block ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <div className="text-4xl mb-2">📹</div>
              <p className="text-gray-600 mb-2">
                {uploading ? 'Uploading...' : 'Click to upload video'}
              </p>
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              {uploading && <p className="text-sm text-gray-500">{progress}% uploaded</p>}
              <p className="text-xs text-gray-400">
                MP4, WebM, OGG (max 100MB)
              </p>
            </label>
          </div>
        )}
        
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  )
}
