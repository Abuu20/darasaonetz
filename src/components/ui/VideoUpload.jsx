import { useState } from 'react'
import { Input, Button } from './index'

export default function VideoUpload({ onUploadComplete, existingUrl = null, label = 'Video URL' }) {
  const [url, setUrl] = useState(existingUrl || '')
  const [videoType, setVideoType] = useState('')

  const detectVideoType = (url) => {
    if (!url) return ''
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube'
    if (url.includes('vimeo.com')) return 'Vimeo'
    if (url.includes('cloudinary.com') && url.includes('/video/')) return 'Cloudinary Video'
    return 'Direct URL'
  }

  const handleUrlChange = (e) => {
    const newUrl = e.target.value
    setUrl(newUrl)
    setVideoType(detectVideoType(newUrl))
  }

  const handleSave = () => {
    if (url.trim()) {
      onUploadComplete(url)
    }
  }

  return (
    <div className="space-y-3">
      {label && <label className="block text-gray-700 dark:text-gray-300 font-medium">{label}</label>}
      
      <div className="space-y-3">
        <Input
          type="url"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..."
        />
        
        {videoType && (
          <div className="flex items-center gap-2 text-sm">
            <span className={`px-2 py-1 rounded ${
              videoType === 'YouTube' ? 'bg-red-100 text-red-700' :
              videoType === 'Vimeo' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {videoType}
            </span>
            <span className="text-gray-500">Video will be embedded from {videoType}</span>
          </div>
        )}
        
        <div className="text-xs text-gray-500 space-y-1 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="font-medium text-blue-800 dark:text-blue-300">📹 Video Hosting Tips:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>YouTube:</strong> Set video to "Unlisted" for privacy</li>
            <li><strong>Vimeo:</strong> Use "Hide from Vimeo.com" for privacy</li>
            <li><strong>Direct URL:</strong> Use a direct MP4 link (hosted elsewhere)</li>
          </ul>
          <p className="mt-2 text-yellow-700 dark:text-yellow-400">⚠️ Do NOT upload video files directly to Darasaone. Use the platforms above.</p>
        </div>
        
        {url && url !== existingUrl && (
          <Button size="sm" onClick={handleSave}>
            Save Video URL
          </Button>
        )}
        
        {existingUrl && (
          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
              ✓ Video URL saved
              <span className="text-xs font-mono break-all">{existingUrl}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
