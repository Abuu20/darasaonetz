import { useState, useRef, useEffect } from 'react'
import { Spinner } from '../ui'

export default function CustomPDFViewer({ url, title }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)
  const iframeRef = useRef(null)
  const [isMobile, setIsMobile] = useState(false)

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }
    checkMobile()
  }, [])

  // Use toolbar=0 - works in Firefox/Safari, ignored in Chrome
  const viewerUrl = `${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0`
  const mobileViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // Mobile version with multiple overlays to block pop-out
  if (isMobile) {
    return (
      <div 
        ref={containerRef} 
        className="relative w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
      >
        {/* Fullscreen Button */}
        {!loading && !error && (
          <button
            onClick={toggleFullscreen}
            className="absolute top-2 right-2 z-30 p-2 bg-black/60 hover:bg-black/80 text-white rounded-lg transition backdrop-blur-sm shadow-lg"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? '🗗' : '⛶'}
          </button>
        )}

        {/* Overlay 1: Blocks top-right area (pop-out button) */}
        <div 
          className="absolute top-0 right-0 w-20 h-12 z-20 cursor-default"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
        />

        {/* Overlay 2: Blocks top-left area (menu button) */}
        <div 
          className="absolute top-0 left-0 w-16 h-12 z-20 cursor-default"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
        />

        {/* Overlay 3: Blocks bottom bar (download/print) */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-14 z-20 cursor-default"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
        />

        {/* Overlay 4: Blocks right side area (additional buttons) */}
        <div 
          className="absolute top-1/2 right-0 w-12 h-32 -translate-y-1/2 z-20 cursor-default"
          style={{ pointerEvents: 'auto', background: 'transparent' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
        />

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner />
            <span className="ml-2 text-sm text-gray-500">Loading PDF...</span>
          </div>
        )}
        
        <iframe
          ref={iframeRef}
          src={mobileViewerUrl}
          title={title || 'PDF Document'}
          className="w-full h-full border-0"
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false)
            setError(true)
          }}
          style={{ display: loading ? 'none' : 'block' }}
          allow="fullscreen"
        />
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
            <p className="text-red-500 mb-2 text-center">⚠️ Cannot load PDF on mobile</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 text-sm hover:underline"
              onClick={(e) => {
                e.preventDefault()
                window.open(url, '_blank')
              }}
            >
              Open PDF in new tab
            </a>
          </div>
        )}
      </div>
    )
  }

  // Desktop version
  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden"
    >
      {/* Fullscreen Button */}
      {!loading && !error && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-2 right-2 z-20 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition backdrop-blur-sm"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? '🗗' : '⛶'}
        </button>
      )}

      {/* Invisible overlay to block print/save buttons */}
      <div 
        className="absolute top-0 right-0 w-32 h-16 z-10 cursor-default"
        style={{ pointerEvents: 'auto', background: 'transparent' }}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); return false }}
      />

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <Spinner />
          <span className="ml-2 text-sm text-gray-500">Loading PDF...</span>
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={viewerUrl}
        title={title || 'PDF Document'}
        className="w-full h-full border-0"
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false)
          setError(true)
        }}
        style={{ display: loading ? 'none' : 'block' }}
      />
      
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
          <p className="text-red-500 mb-2">⚠️ Cannot load PDF</p>
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 text-sm hover:underline"
          >
            Open PDF directly
          </a>
        </div>
      )}
    </div>
  )
}