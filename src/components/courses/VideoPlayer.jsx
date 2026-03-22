import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'

export default function VideoPlayer({ videoUrl, title }) {
  const [error, setError] = useState(false)
  const [signedUrl, setSignedUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (videoUrl) {
      getSignedUrl()
    }
  }, [videoUrl])

  async function getSignedUrl() {
    try {
      setLoading(true)
      
      // Check if it's a Supabase storage URL
      if (videoUrl.includes('supabase.co/storage')) {
        // Extract the path from the URL
        const urlParts = videoUrl.split('/')
        const path = urlParts.slice(urlParts.indexOf('lesson-videos') + 1).join('/')
        
        // Get a signed URL (valid for 1 hour)
        const { data, error } = await supabase.storage
          .from('lesson-videos')
          .createSignedUrl(path, 3600)
        
        if (error) throw error
        setSignedUrl(data.signedUrl)
      } else {
        // External URL (YouTube, Vimeo, etc.)
        setSignedUrl(videoUrl)
      }
    } catch (error) {
      console.error('Error getting signed URL:', error)
      setError(true)
    } finally {
      setLoading(false)
    }
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
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            title={title}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )
      }
      
      case 'vimeo': {
        const videoId = getVimeoId(signedUrl)
        if (!videoId) return <div className="text-red-500">Invalid Vimeo URL</div>
        return (
          <iframe
            src={`https://player.vimeo.com/video/${videoId}`}
            title={title}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )
      }
      
      case 'direct':
        return (
          <video
            src={signedUrl}
            controls
            className="w-full h-full"
            onError={() => setError(true)}
          >
            <track kind="captions" />
            Your browser does not support the video tag.
          </video>
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
    <div className="bg-black rounded-lg overflow-hidden aspect-video">
      {renderVideo()}
    </div>
  )
}
