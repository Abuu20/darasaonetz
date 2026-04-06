import React from 'react'
import VideoPlayer from '../../../../components/courses/VideoPlayer'
import MaterialViewer from '../../../../components/courses/MaterialViewer'
import MaterialGallery from '../../../../components/courses/MaterialGallery'

const LessonContent = ({ 
  currentLesson, 
  lessonMaterials, 
  onVideoTimeUpdate, 
  onBookmark 
}) => {
  const isYouTubeVideo = currentLesson?.video_url && (
    currentLesson.video_url.includes('youtube.com') || 
    currentLesson.video_url.includes('youtu.be') ||
    currentLesson.video_url.includes('vimeo.com')
  )
  
  const isPDForImage = currentLesson?.video_url && (
    currentLesson.video_url.includes('.pdf') ||
    currentLesson.video_url.includes('.jpg') ||
    currentLesson.video_url.includes('.jpeg') ||
    currentLesson.video_url.includes('.png') ||
    currentLesson.video_url.includes('.gif') ||
    currentLesson.video_url.includes('.webp') ||
    currentLesson.video_url.includes('cloudinary.com')
  )

  const hasTextContent = currentLesson?.content && currentLesson.content.trim().length > 0

  if (!currentLesson) return null

  return (
    <div className="space-y-6">
      {isYouTubeVideo && (
        <div className="rounded-xl overflow-hidden shadow-lg bg-black">
          <VideoPlayer 
            videoUrl={currentLesson.video_url}
            title={currentLesson.title}
            onTimeUpdate={onVideoTimeUpdate}
            onBookmark={onBookmark}
          />
        </div>
      )}
      {isPDForImage && (
        <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
          <MaterialViewer 
            url={currentLesson.video_url} 
            title={currentLesson.title} 
          />
        </div>
      )}
      {lessonMaterials.length > 0 && (
        <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-lg">
          <MaterialGallery 
            materials={lessonMaterials} 
            title={currentLesson?.title} 
          />
        </div>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold">{currentLesson?.title}</h1>
          </div>
        </div>
      </div>
      {hasTextContent && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <div 
            className="lesson-content"
            dangerouslySetInnerHTML={{ __html: currentLesson.content }}
          />
        </div>
      )}
    </div>
  )
}

export default LessonContent