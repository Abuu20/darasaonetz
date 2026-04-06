import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useTheme } from '../../context/ThemeContext'

const VideoPlayer = forwardRef(({ videoUrl, title, onTimeUpdate, onBookmark, lessonId, courseId }, ref) => {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showBookmarkPopup, setShowBookmarkPopup] = useState(false)
  const [bookmarkNote, setBookmarkNote] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [volume, setVolume] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [embedUrl, setEmbedUrl] = useState(null)
  const [isYouTube, setIsYouTube] = useState(false)
  const [playerReady, setPlayerReady] = useState(false)
  const [videoId, setVideoId] = useState(null)
  
  const { isMobile } = useTheme()
  const videoRef = useRef(null)
  const youtubeContainerRef = useRef(null)
  const youtubePlayerRef = useRef(null)
  const controlsTimeoutRef = useRef(null)
  const timeUpdateIntervalRef = useRef(null)

  // Extract YouTube ID from ANY URL format
  const extractYouTubeId = (url) => {
    if (!url) return null
    
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
    if (shortMatch) return shortMatch[1]
    
    const watchMatch = url.match(/[?&]v=([^&?]+)/)
    if (watchMatch) return watchMatch[1]
    
    const embedMatch = url.match(/embed\/([^?&]+)/)
    if (embedMatch) return embedMatch[1]
    
    const shortsMatch = url.match(/shorts\/([^?&]+)/)
    if (shortsMatch) return shortsMatch[1]
    
    return null
  }

  // Initialize video
  useEffect(() => {
    if (!videoUrl) {
      setError(true)
      setLoading(false)
      return
    }
    
    const ytId = extractYouTubeId(videoUrl)
    
    if (ytId) {
      setVideoId(ytId)
      setIsYouTube(true)
      setEmbedUrl(`https://www.youtube.com/embed/${ytId}`)
      setLoading(false)
    } else {
      setIsYouTube(false)
      setEmbedUrl(videoUrl)
      setLoading(false)
    }
  }, [videoUrl])

  useImperativeHandle(ref, () => ({
    seekTo: (time) => {
      if (youtubePlayerRef.current && playerReady) {
        youtubePlayerRef.current.seekTo(time, true)
        setCurrentTime(time)
      } else if (videoRef.current) {
        videoRef.current.currentTime = time
        setCurrentTime(time)
      }
    },
    play: () => {
      if (youtubePlayerRef.current && playerReady) {
        youtubePlayerRef.current.playVideo()
      } else if (videoRef.current) {
        videoRef.current.play()
      }
    },
    pause: () => {
      if (youtubePlayerRef.current && playerReady) {
        youtubePlayerRef.current.pauseVideo()
      } else if (videoRef.current) {
        videoRef.current.pause()
      }
    }
  }))

  // Load YouTube API and initialize player
  useEffect(() => {
    if (!isYouTube || !videoId || youtubePlayerRef.current) return
    
    let isMounted = true
    
    const initPlayer = () => {
      if (!youtubeContainerRef.current || !window.YT || !window.YT.Player) {
        setTimeout(initPlayer, 100)
        return
      }
      
      try {
        youtubePlayerRef.current = new window.YT.Player(youtubeContainerRef.current, {
          videoId: videoId,
          playerVars: {
            autoplay: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            origin: window.location.origin,
            enablejsapi: 1
          },
          events: {
            onReady: (event) => {
              if (isMounted) {
                setPlayerReady(true)
                setDuration(event.target.getDuration())
              }
            },
            onStateChange: (event) => {
              if (!isMounted) return
              
              const isPlayingState = event.data === window.YT.PlayerState.PLAYING
              setIsPlaying(isPlayingState)
              
              // Clear existing interval
              if (timeUpdateIntervalRef.current) {
                clearInterval(timeUpdateIntervalRef.current)
              }
              
              // Start tracking time when playing
              if (isPlayingState) {
                timeUpdateIntervalRef.current = setInterval(() => {
                  if (youtubePlayerRef.current && playerReady && isMounted) {
                    try {
                      const time = youtubePlayerRef.current.getCurrentTime()
                      setCurrentTime(time)
                      onTimeUpdate?.(time)
                    } catch (e) {}
                  }
                }, 1000)
              }
            },
            onError: () => {
              if (isMounted) {
                setError(true)
                setLoading(false)
              }
            }
          }
        })
      } catch (error) {
        if (isMounted) {
          setError(true)
          setLoading(false)
        }
      }
    }
    
    // Load YouTube API if not loaded
    if (!window.YT) {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)
      
      window.onYouTubeIframeAPIReady = () => {
        initPlayer()
      }
    } else {
      initPlayer()
    }
    
    return () => {
      isMounted = false
      if (timeUpdateIntervalRef.current) clearInterval(timeUpdateIntervalRef.current)
      if (youtubePlayerRef.current) {
        try {
          youtubePlayerRef.current.destroy()
        } catch (e) {}
        youtubePlayerRef.current = null
      }
    }
  }, [isYouTube, videoId])

  // Handle native video events (non-YouTube)
  useEffect(() => {
    const video = videoRef.current
    if (video && !isYouTube) {
      const handleTimeUpdate = () => {
        const time = video.currentTime
        setCurrentTime(time)
        onTimeUpdate?.(time)
      }
      const handleLoadedMetadata = () => setDuration(video.duration)
      const handlePlay = () => setIsPlaying(true)
      const handlePause = () => setIsPlaying(false)
      const handleError = () => setError(true)
      
      video.addEventListener('timeupdate', handleTimeUpdate)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('play', handlePlay)
      video.addEventListener('pause', handlePause)
      video.addEventListener('error', handleError)
      
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('play', handlePlay)
        video.removeEventListener('pause', handlePause)
        video.removeEventListener('error', handleError)
      }
    }
  }, [onTimeUpdate, isYouTube])

  const handlePlayPause = () => {
    if (isYouTube && youtubePlayerRef.current && playerReady) {
      if (isPlaying) {
        youtubePlayerRef.current.pauseVideo()
      } else {
        youtubePlayerRef.current.playVideo()
      }
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
    }
  }

  const handleVolumeClick = () => {
    if (isYouTube && youtubePlayerRef.current && playerReady) {
      if (isMuted) {
        youtubePlayerRef.current.unMute()
        setIsMuted(false)
      } else {
        youtubePlayerRef.current.mute()
        setIsMuted(true)
      }
    } else if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (isYouTube && youtubePlayerRef.current && playerReady) {
      youtubePlayerRef.current.setVolume(newVolume * 100)
      if (newVolume === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
        youtubePlayerRef.current.unMute()
      }
    } else if (videoRef.current) {
      videoRef.current.volume = newVolume
      videoRef.current.muted = newVolume === 0
      setIsMuted(newVolume === 0)
    }
  }

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value)
    setCurrentTime(newTime)
    if (isYouTube && youtubePlayerRef.current && playerReady) {
      youtubePlayerRef.current.seekTo(newTime, true)
    } else if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  const handleFullscreen = () => {
    const container = document.querySelector('.video-container')
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const handleBookmarkClick = () => setShowBookmarkPopup(true)

  const handleSaveBookmark = async () => {
    if (onBookmark) await onBookmark(currentTime, bookmarkNote)
    setShowBookmarkPopup(false)
    setBookmarkNote('')
  }

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '00:00'
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseMove = () => {
    setShowControls(true)
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current)
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false)
    }, 3000)
  }

  if (loading) {
    return (
      <div className="bg-gray-900 aspect-video flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (error || !embedUrl) {
    return (
      <div className="bg-gray-900 aspect-video flex flex-col items-center justify-center text-white p-6">
        <p className="text-4xl mb-3">⚠️</p>
        <p className="text-lg font-semibold mb-2">Failed to load video</p>
        <p className="text-sm text-gray-400 mb-4 text-center max-w-md break-all">
          {videoUrl}
        </p>
      </div>
    )
  }

  // YouTube Player with custom controls
  if (isYouTube && videoId) {
    return (
      <>
        <div 
          className="relative bg-black aspect-video cursor-pointer video-container"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setShowControls(false)}
        >
          <div ref={youtubeContainerRef} className="w-full h-full" />
          
          <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            <button
              onClick={handlePlayPause}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all hover:scale-105"
            >
              <span className="text-3xl text-white">
                {isPlaying ? '⏸' : '▶'}
              </span>
            </button>

            <div className="absolute bottom-14 left-4 right-4">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: duration ? `linear-gradient(to right, #3b82f6 ${(currentTime / duration) * 100}%, #4b5563 ${(currentTime / duration) * 100}%)` : '#4b5563'
                }}
              />
              <div className="flex justify-between text-white text-xs mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="absolute bottom-3 left-4 right-4 flex items-center gap-3">
              <button onClick={handlePlayPause} className="text-white hover:text-blue-400 transition p-1">
                {isPlaying ? '⏸' : '▶'}
              </button>
              
              <div className="flex items-center gap-2">
                <button onClick={handleVolumeClick} className="text-white hover:text-blue-400 transition p-1">
                  {isMuted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <button onClick={handleBookmarkClick} className="text-white hover:text-blue-400 transition p-1 ml-auto">
                🔖 {!isMobile && 'Bookmark'}
              </button>

              <button onClick={handleFullscreen} className="text-white hover:text-blue-400 transition p-1">
                ⛶
              </button>
            </div>
          </div>
        </div>

        {showBookmarkPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-sm w-full mx-4">
              <h3 className="text-lg font-bold mb-2">Add Bookmark</h3>
              <p className="text-sm text-gray-600 mb-3">Bookmark at {formatTime(currentTime)}</p>
              <textarea
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                placeholder="Add a note (optional)"
                rows="3"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />
              <div className="flex gap-2">
                <button onClick={handleSaveBookmark} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                  Save
                </button>
                <button onClick={() => setShowBookmarkPopup(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  // Direct video file (MP4, etc.) with controls
  return (
    <>
      <div className="relative bg-black video-container">
        <video
          ref={videoRef}
          src={embedUrl}
          className="w-full aspect-video"
          onError={() => setError(true)}
          controlsList="nodownload"
          controls
        />
        <div className="absolute bottom-4 right-4 z-10">
          <button
            onClick={handleBookmarkClick}
            className={`${isMobile ? 'p-2 text-xs' : 'p-2 text-sm'} bg-black/70 hover:bg-black text-white rounded-full shadow-lg transition-all backdrop-blur-sm`}
          >
            🔖 {isMobile ? '' : 'Bookmark at'} {formatTime(currentTime)}
          </button>
        </div>
      </div>

      {showBookmarkPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold mb-2">Add Bookmark</h3>
            <p className="text-sm text-gray-600 mb-3">Bookmark at {formatTime(currentTime)}</p>
            <textarea
              value={bookmarkNote}
              onChange={(e) => setBookmarkNote(e.target.value)}
              placeholder="Add a note (optional)"
              rows="3"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <div className="flex gap-2">
              <button onClick={handleSaveBookmark} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
                Save
              </button>
              <button onClick={() => setShowBookmarkPopup(false)} className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
})

VideoPlayer.displayName = 'VideoPlayer'
export default VideoPlayer