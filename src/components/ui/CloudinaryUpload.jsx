import { useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function CloudinaryUpload({ 
  onUploadComplete, 
  folder = 'darasaone', 
  label = 'Upload File', 
  existingUrl = null, 
  accept = 'image/*,application/pdf' 
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(existingUrl)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const { showSuccess, showError } = useTheme()

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dzbj45u3n'
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'darasaone_preset'

  // Check if file is PDF
  const isPDF = (file) => file.type === 'application/pdf'
  
  // Check if file is image
  const isImage = (file) => file.type.startsWith('image/')

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!isImage(file) && !isPDF(file)) {
      showError('Only images and PDF files are allowed')
      return
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showError('File too large. Maximum size is 10MB')
      return
    }

    setUploading(true)
    setProgress(0)
    setError(null)

    // Create preview for images
    if (isImage(file)) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result)
      }
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    formData.append('folder', folder)
    
    // IMPORTANT: For PDFs, we need to specify resource_type
    let uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/upload`
    
    // For PDFs, use raw upload type
    if (isPDF(file)) {
      uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`
    }

    try {
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = (event.loaded / event.total) * 100
          setProgress(Math.round(percent))
        }
      }

      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          if (data.secure_url) {
            setPreview(data.secure_url)
            onUploadComplete(data.secure_url, data.public_id)
            showSuccess(`${isPDF(file) ? 'PDF' : 'Image'} uploaded successfully!`)
          } else {
            throw new Error('Upload failed')
          }
        } else {
          throw new Error('Upload failed')
        }
        setUploading(false)
      }

      xhr.onerror = () => {
        throw new Error('Network error')
      }

      xhr.open('POST', uploadUrl)
      xhr.send(formData)

    } catch (error) {
      console.error('Upload error:', error)
      setError(error.message)
      showError('Failed to upload file. Please try again.')
      setUploading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onUploadComplete(null, null)
  }

  const isImagePreview = preview && (preview.match(/\.(jpg|jpeg|png|gif|webp)$/i) || preview.startsWith('data:image'))

  return (
    <div className="space-y-3">
      {label && <label className="block text-gray-700 dark:text-gray-300 font-medium">{label}</label>}
      
      <div className="flex items-start gap-4">
        {/* Preview */}
        {preview && (
          <div className="relative">
            {isImagePreview ? (
              <img 
                src={preview} 
                alt="Preview" 
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center border border-gray-200 dark:border-gray-700">
                <span className="text-2xl">📄</span>
                <span className="text-[10px] mt-1">PDF</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}
        
        {/* Upload Button */}
        <div className="flex-1">
          <input
            type="file"
            id="cloudinary-upload"
            accept={accept}
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="cloudinary-upload"
            className={`inline-flex items-center px-4 py-2 rounded-lg cursor-pointer transition ${
              uploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {uploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading {progress}%
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {label}
              </>
            )}
          </label>
          {uploading && (
            <div className="mt-2">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          <p className="text-xs text-gray-500 mt-2">
            {accept.includes('pdf') ? 'PDF documents' : 'Images'} • Max 10MB
          </p>
        </div>
      </div>
    </div>
  )
}