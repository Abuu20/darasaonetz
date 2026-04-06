import { useState, useEffect, useRef } from 'react'
import { Spinner } from '../ui'
import CustomPDFViewer from './CustomPDFViewer'

export default function MaterialViewer({ url, title }) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenRef = useRef(null)

  if (!url) return null

  const isPDF = url.includes('.pdf') || 
                url.includes('/raw/upload') ||
                url.endsWith('.pdf') ||
                url.match(/\.pdf(\?|$)/i)

  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || 
                  url.includes('image/upload') ||
                  (url.includes('cloudinary.com') && !url.includes('/raw/upload'))

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
  const isVimeo = url.includes('vimeo.com')
  const isVideo = isYouTube || isVimeo || url.match(/\.(mp4|webm|ogg)$/i)

  if (isVideo) return null

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleExpand = () => setIsExpanded(!isExpanded)
  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return
    if (!isFullscreen) {
      fullscreenRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // For PDFs - Clean viewer with no pop-out
  if (isPDF) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border">
        <div 
          className="p-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">📄</span>
            <span className="font-medium text-sm truncate flex-1">{title || 'PDF Document'}</span>
            <span className="text-xs text-gray-500">Click to {isExpanded ? 'collapse' : 'expand'}</span>
          </div>
          <button className="p-1 text-gray-500">{isExpanded ? '▼' : '▶'}</button>
        </div>
        
        {isExpanded && (
          <div className="border-t" ref={fullscreenRef}>
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 transition text-xs"
              >
                {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
              </button>
            </div>
            <div className="relative" style={{ height: isFullscreen ? 'calc(100vh - 80px)' : '500px' }}>
              <CustomPDFViewer url={url} title={title} />
            </div>
          </div>
        )}
      </div>
    )
  }

  // For Images
  if (isImage) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border">
        <div 
          className="p-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={toggleExpand}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">🖼️</span>
            <span className="font-medium text-sm truncate flex-1">{title || 'Image'}</span>
            <span className="text-xs text-gray-500">Click to {isExpanded ? 'collapse' : 'expand'}</span>
          </div>
          <button className="p-1 text-gray-500">{isExpanded ? '▼' : '▶'}</button>
        </div>
        
        {isExpanded && (
          <div className="border-t" ref={fullscreenRef}>
            <div className="p-2 bg-gray-50 dark:bg-gray-700/30 flex justify-end">
              <button
                onClick={(e) => { e.stopPropagation(); toggleFullscreen() }}
                className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 transition text-xs"
              >
                {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
              </button>
            </div>
            <div className="p-3 flex justify-center items-center bg-gray-100 dark:bg-gray-900" style={{ 
              minHeight: isFullscreen ? 'calc(100vh - 80px)' : '400px',
              maxHeight: isFullscreen ? 'calc(100vh - 80px)' : '500px',
              overflow: 'auto'
            }}>
              <img 
                src={url} 
                alt={title || 'Course material'}
                className="max-w-full h-auto max-h-full object-contain rounded-lg cursor-pointer"
                onClick={toggleFullscreen}
              />
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
      <div 
        className="p-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        onClick={toggleExpand}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="text-lg">📁</span>
          <span className="font-medium text-sm truncate flex-1">{title || 'Course Material'}</span>
          <span className="text-xs text-gray-500">Click to {isExpanded ? 'collapse' : 'expand'}</span>
        </div>
        <button className="p-1 text-gray-500">{isExpanded ? '▼' : '▶'}</button>
      </div>
      
      {isExpanded && (
        <div className="border-t p-4 text-center">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition"
          >
            📥 View Material
          </a>
        </div>
      )}
    </div>
  )
}