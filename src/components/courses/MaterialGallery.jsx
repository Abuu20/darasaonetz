import { useState, useEffect, useRef } from 'react'
import CustomPDFViewer from './CustomPDFViewer'

export default function MaterialGallery({ materials, title }) {
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const fullscreenRef = useRef(null)

  if (!materials || materials.length === 0) return null

  // Improved file type detection
  const getFileType = (url) => {
    if (!url) return 'document'
    
    const urlLower = url.toLowerCase()
    if (urlLower.includes('.pdf') || urlLower.includes('/raw/upload')) return 'pdf'
    if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) return 'image'
    if (urlLower.match(/\.(mp4|webm|ogg|mov|avi)$/i)) return 'video'
    
    if (url.includes('cloudinary.com')) {
      if (url.includes('/image/upload')) return 'image'
      if (url.includes('/raw/upload') || url.includes('.pdf')) return 'pdf'
      if (url.includes('/video/upload')) return 'video'
    }
    
    return 'document'
  }

  const getFileIcon = (url) => {
    const type = getFileType(url)
    if (type === 'pdf') return '📄'
    if (type === 'image') return '🖼️'
    if (type === 'video') return '🎬'
    return '📁'
  }

  const getFileLabel = (url) => {
    const type = getFileType(url)
    if (type === 'pdf') return 'PDF Document'
    if (type === 'image') return 'Image'
    if (type === 'video') return 'Video'
    return 'Document'
  }

  const openMaterial = (material, index) => {
    setSelectedMaterial(material)
    setCurrentIndex(index)
    setExpanded(true)
    setIsFullscreen(false)
  }

  const closeModal = () => {
    setExpanded(false)
    setSelectedMaterial(null)
    setIsFullscreen(false)
  }

  const nextMaterial = () => {
    const next = (currentIndex + 1) % materials.length
    setCurrentIndex(next)
    setSelectedMaterial(materials[next])
  }

  const prevMaterial = () => {
    const prev = (currentIndex - 1 + materials.length) % materials.length
    setCurrentIndex(prev)
    setSelectedMaterial(materials[prev])
  }

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  const toggleFullscreen = () => {
    if (!fullscreenRef.current) return
    
    if (!isFullscreen) {
      if (fullscreenRef.current.requestFullscreen) {
        fullscreenRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // Count materials by type
  const pdfCount = materials.filter(m => getFileType(m.material_url) === 'pdf').length
  const imageCount = materials.filter(m => getFileType(m.material_url) === 'image').length
  const videoCount = materials.filter(m => getFileType(m.material_url) === 'video').length
  const documentCount = materials.filter(m => getFileType(m.material_url) === 'document').length

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border">
        {/* Collapsible Header */}
        <div 
          className="p-3 bg-gray-50 dark:bg-gray-700/50 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          onClick={toggleCollapse}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-lg">📚</span>
            <span className="font-medium text-sm truncate flex-1">
              Course Materials ({materials.length})
            </span>
            <div className="flex gap-2 text-xs text-gray-500">
              {pdfCount > 0 && <span>📄 {pdfCount}</span>}
              {imageCount > 0 && <span>🖼️ {imageCount}</span>}
              {videoCount > 0 && <span>🎬 {videoCount}</span>}
              {documentCount > 0 && <span>📁 {documentCount}</span>}
            </div>
            <span className="text-xs text-gray-500">
              Click to {isCollapsed ? 'expand' : 'collapse'}
            </span>
          </div>
          <button className="p-1 text-gray-500">
            {isCollapsed ? '▶' : '▼'}
          </button>
        </div>

        {/* Collapsible Content */}
        {!isCollapsed && (
          <div className="border-t p-4">
            {/* Materials Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {materials.map((material, idx) => {
                const fileType = getFileType(material.material_url)
                const fileIcon = getFileIcon(material.material_url)
                const fileLabel = getFileLabel(material.material_url)
                
                return (
                  <button
                    key={idx}
                    onClick={() => openMaterial(material, idx)}
                    className="group relative p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all text-center border border-gray-200 dark:border-gray-700 hover:shadow-md"
                  >
                    <div className="text-3xl mb-1">{fileIcon}</div>
                    <p className="text-xs truncate font-medium">{material.title || `Material ${idx + 1}`}</p>
                    <span className="text-[10px] text-gray-400 mt-1 block capitalize">{fileLabel}</span>
                  </button>
                )
              })}
            </div>

            {materials.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📁</p>
                <p className="text-sm">No materials available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for viewing materials */}
      {expanded && selectedMaterial && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={closeModal}>
          <div 
            ref={fullscreenRef}
            className="relative max-w-5xl w-full max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl overflow-hidden flex flex-col" 
            onClick={e => e.stopPropagation()}
          >
            {/* Header - No pop-out button */}
            <div className="p-4 border-b flex justify-between items-center bg-white dark:bg-gray-800">
              <div>
                <h3 className="font-bold">{selectedMaterial.title || `Material ${currentIndex + 1}`}</h3>
                <p className="text-xs text-gray-500">{currentIndex + 1} of {materials.length} • {getFileLabel(selectedMaterial.material_url)}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? '🗗' : '⛶'}
                </button>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">✕</button>
              </div>
            </div>

            {/* Content - No pop-out buttons */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
              {/* PDF Viewer - Custom with no pop-out */}
              {getFileType(selectedMaterial.material_url) === 'pdf' && (
                <div className="w-full h-[70vh]">
                  <CustomPDFViewer 
                    url={selectedMaterial.material_url}
                    title={selectedMaterial.title}
                  />
                </div>
              )}

              {/* Image Viewer */}
              {getFileType(selectedMaterial.material_url) === 'image' && (
                <div className="flex justify-center items-center min-h-[60vh]">
                  <img 
                    src={selectedMaterial.material_url} 
                    alt={selectedMaterial.title}
                    className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
                    onClick={toggleFullscreen}
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              )}

              {/* Video Player */}
              {getFileType(selectedMaterial.material_url) === 'video' && (
                <video 
                  src={selectedMaterial.material_url} 
                  controls 
                  className="w-full rounded-lg"
                  autoPlay={false}
                  controlsList="nodownload"
                />
              )}

              {/* Document Fallback */}
              {getFileType(selectedMaterial.material_url) === 'document' && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">This document is ready for viewing</p>
                  <a 
                    href={selectedMaterial.material_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    📥 Open Document
                  </a>
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            {materials.length > 1 && (
              <div className="absolute left-1/2 bottom-4 -translate-x-1/2 flex gap-4">
                <button 
                  onClick={prevMaterial} 
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition backdrop-blur-sm"
                >
                  ◀
                </button>
                <button 
                  onClick={nextMaterial} 
                  className="p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition backdrop-blur-sm"
                >
                  ▶
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}