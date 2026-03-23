import { useState, useEffect, forwardRef, useImperativeHandle, useRef } from 'react'
import { Button } from '../ui'

const VideoPlayer = forwardRef(({ videoUrl, title, onTimeUpdate, onLoaded, onBookmark, lessonId, courseId }, ref) => {
  const [error, setError] = useState(false)
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [showBookmarkPopup, setShowBookmarkPopup] = useState(false)
  const [bookmarkNote, setBookmarkNote] = useState('')
  const videoRef = useRef(null)
  const timeUpdateInterval = useRef(null)

  useImperativeHandle(ref, () => ({
    getCurrentTime: () => {
      return videoRef.current?.currentTime || 0
    },
    seekTo: (time) => {
      if (videoRef.current) {
        videoRef.current.currentTime = time
      }
    },
    play: () => {
      if (videoRef.current) {
        videoRef.current.play()
      }
    },
    pause: () => {
      if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }))

  useEffect(() => {
    if (videoUrl) {
      getSignedUrl()
    }
  }, [videoUrl])

  // Set up time update interval for better precision
  useEffect(() => {
    const video = videoRef.current
    if (video) {
      const handleTimeUpdate = () => {
        const time = video.currentTime
        setCurrentTime(time)
        if (onTimeUpdate) {
          onTimeUpdate(time)
        }
      }
      
      video.addEventListener('timeupdate', handleTimeUpdate)
      
      // Also use interval for more frequent updates
      timeUpdateInterval.current = setInterval(() => {
        if (video && !video.paused) {
          const time = video.currentTime
          setCurrentTime(time)
          if (onTimeUpdate) {
            onTimeUpdate(time)
          }
        }
      }, 100)
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        if (timeUpdateInterval.current) {
          clearInterval(timeUpdateInterval.current)
        }
      }
    }
  }, [onTimeUpdate])

  useEffect(() => {
    const video = videoRef.current
    if (video && onLoaded) {
      const handleLoaded = () => {
        onLoaded()
      }
      video.addEventListener('loadedmetadata', handleLoaded)
      return () => video.removeEventListener('loadedmetadata', handleLoaded)
    }
  }, [onLoaded])

  async function getSignedUrl() {
    try {
      setLoading(true)
      
      if (videoUrl.includes('supabase.co/storage')) {
        const urlParts = videoUrl.split('/')
        const path = urlParts.slice(urlParts.indexOf('lesson-videos') + 1).join('/')
        
        const { supabase } = await import('../../supabase/client')
        const { data, error } = await supabase.storage
          .from('lesson-videos')
          .createSignedUrl(path, 3600)
        
        if (error) throw error
        setSignedUrl(data.signedUrl)
      } else {
        setSignedUrl(videoUrl)
      }
    } catch (error) {
      console.error('Error getting signed URL:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  const handleBookmarkClick = () => {
    // Capture current time directly from video element
    const exactTime = videoRef.current?.currentTime || currentTime
    setCurrentTime(exactTime)
    setShowBookmarkPopup(true)
  }

  const handleSaveBookmark = async () => {
    const exactTime = videoRef.current?.currentTime || currentTime
    if (onBookmark) {
      await onBookmark(exactTime, bookmarkNote)
    }
    setShowBookmarkPopup(false)
    setBookmarkNote('')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getVideoType = (url) => {
    if (!url) return 'none'
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube'
    }
    if (url.includes('vimeo.com')) {
      return 'vimeo'
    }
    if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
      return 'direct'
    }
    return 'unknown'
  }

  const getYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  const getVimeoId = (url) => {
    const regExp = /vimeo\.com\/(?:video\/)?(\d+)/
    const match = url.match(regExp)
    return match ? match[1] : null
  }

  const renderVideo = () => {
    if (loading) {
      return (
        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )
    }

    if (!signedUrl) {
      return (
        <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
          <div className="text-center">
            <p className="text-4xl mb-2">📹</p>
            <p>No video available for this lesson</p>
          </div>
        </div>
      )
    }

    const type = getVideoType(signedUrl)
    
    switch(type) {
      case 'youtube': {
        const videoId = getYouTubeId(signedUrl)
        if (!videoId) return <div className="text-red-500">Invalid YouTube URL</div>
        return (
          <div className="relative">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}`}
              title={title}
              className="w-full h-full aspect-video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute bottom-4 right-4 z-10">
              <Button 
                size="sm" 
                onClick={handleBookmarkClick}
                className="bg-black/70 hover:bg-black text-white shadow-lg"
              >
                🔖 Bookmark at {formatTime(currentTime)}
              </Button>
            </div>
          </div>
        )
      }
      
      case 'vimeo': {
        const videoId = getVimeoId(signedUrl)
        if (!videoId) return <div className="text-red-500">Invalid Vimeo URL</div>
        return (
          <div className="relative">
            <iframe
              src={`https://player.vimeo.com/video/${videoId}`}
              title={title}
              className="w-full h-full aspect-video"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
            />
            <div className="absolute bottom-4 right-4 z-10">
              <Button 
                size="sm" 
                onClick={handleBookmarkClick}
                className="bg-black/70 hover:bg-black text-white shadow-lg"
              >
                🔖 Bookmark at {formatTime(currentTime)}
              </Button>
            </div>
          </div>
        )
      }
      
      case 'direct':
        return (
          <div className="relative">
            <video
              ref={videoRef}
              src={signedUrl}
              controls
              className="w-full h-full aspect-video"
              onError={() => setError(true)}
              onTimeUpdate={(e) => {
                const time = e.target.currentTime
                setCurrentTime(time)
                if (onTimeUpdate) onTimeUpdate(time)
              }}
            >
              <track kind="captions" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute bottom-4 right-4 z-10">
              <Button 
                size="sm" 
                onClick={handleBookmarkClick}
                className="bg-black/70 hover:bg-black text-white shadow-lg"
              >
                🔖 Bookmark at {formatTime(currentTime)}
              </Button>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-4xl mb-2">❓</p>
              <p>Unsupported video format</p>
            </div>
          </div>
        )
    }
  }

  if (error) {
    return (
      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-4xl mb-2">⚠️</p>
          <p>Failed to load video</p>
          <p className="text-sm text-gray-400 mt-2">The video might be private or inaccessible</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="bg-black rounded-lg overflow-hidden aspect-video relative">
        {renderVideo()}
      </div>
      
      {/* Bookmark Popup */}
      {showBookmarkPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Add Bookmark</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Bookmark at {formatTime(videoRef.current?.currentTime || currentTime)}
            </p>
            <textarea
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <Button onClick={handleSaveBookmark}>
                Save Bookmark
              </Button>
              <Button variant="outline" onClick={() => setShowBookmarkPopup(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

VideoPlayer.displayName = 'VideoPlayer'

export default VideoPlayer
