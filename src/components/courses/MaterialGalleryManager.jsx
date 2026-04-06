import { useState } from 'react'
import { supabase } from '../../supabase/client'
import { Button, Spinner } from '../ui'
import CloudinaryUpload from '../ui/CloudinaryUpload'
import { useTheme } from '../../context/ThemeContext'

export default function MaterialGalleryManager({ lessonId, courseId, materials, onMaterialsChange }) {
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const { showSuccess, showError } = useTheme()

  const handleUploadComplete = async (url) => {
    if (!url) return
    
    setUploading(true)
    try {
      const { error } = await supabase
        .from('lesson_materials')
        .insert({
          lesson_id: lessonId,
          material_url: url,
          title: 'New Material',
          type: getFileType(url),
          display_order: materials.length
        })

      if (error) throw error
      showSuccess('Material added successfully')
      onMaterialsChange()
    } catch (error) {
      console.error('Error adding material:', error)
      showError('Failed to add material')
    } finally {
      setUploading(false)
    }
  }

  const getFileType = (url) => {
    if (url?.includes('.pdf')) return 'pdf'
    if (url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image'
    if (url?.match(/\.(mp4|webm|ogg)$/i)) return 'video'
    return 'document'
  }

  const getFileIcon = (url) => {
    const type = getFileType(url)
    if (type === 'pdf') return '📄'
    if (type === 'image') return '🖼️'
    if (type === 'video') return '🎬'
    return '📁'
  }

  const handleDelete = async (materialId) => {
    if (!confirm('Delete this material?')) return
    
    try {
      const { error } = await supabase
        .from('lesson_materials')
        .delete()
        .eq('id', materialId)

      if (error) throw error
      showSuccess('Material deleted')
      onMaterialsChange()
    } catch (error) {
      console.error('Error deleting material:', error)
      showError('Failed to delete material')
    }
  }

  const handleUpdateTitle = async (materialId, newTitle) => {
    try {
      const { error } = await supabase
        .from('lesson_materials')
        .update({ title: newTitle })
        .eq('id', materialId)

      if (error) throw error
      onMaterialsChange()
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }

  const handleMoveUp = async (index) => {
    if (index === 0) return
    
    const current = materials[index]
    const prev = materials[index - 1]
    
    try {
      await supabase
        .from('lesson_materials')
        .update({ display_order: prev.display_order })
        .eq('id', current.id)
      
      await supabase
        .from('lesson_materials')
        .update({ display_order: current.display_order })
        .eq('id', prev.id)
      
      onMaterialsChange()
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  const handleMoveDown = async (index) => {
    if (index === materials.length - 1) return
    
    const current = materials[index]
    const next = materials[index + 1]
    
    try {
      await supabase
        .from('lesson_materials')
        .update({ display_order: next.display_order })
        .eq('id', current.id)
      
      await supabase
        .from('lesson_materials')
        .update({ display_order: current.display_order })
        .eq('id', next.id)
      
      onMaterialsChange()
    } catch (error) {
      console.error('Error reordering:', error)
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Section */}
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
        <h3 className="font-semibold mb-3">Add New Material</h3>
        <CloudinaryUpload
          label="Upload Image or PDF"
          onUploadComplete={handleUploadComplete}
          folder={`course-materials/${courseId}/lesson-${lessonId}`}
          accept="image/*,application/pdf"
        />
        <p className="text-xs text-gray-500 mt-2">
          Supported formats: Images (JPG, PNG, GIF, WebP) and PDF documents
        </p>
      </div>

      {/* Materials List */}
      {materials.length > 0 ? (
        <div className="space-y-2">
          <h3 className="font-semibold">Materials ({materials.length})</h3>
          {materials.map((material, index) => (
            <div key={material.id} className="border rounded-lg p-3 flex items-center justify-between group hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-2xl">{getFileIcon(material.material_url)}</span>
                <div className="flex-1">
                  <input
                    type="text"
                    value={material.title || `Material ${index + 1}`}
                    onChange={(e) => handleUpdateTitle(material.id, e.target.value)}
                    className="font-medium text-sm bg-transparent border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
                  />
                  <p className="text-xs text-gray-400 capitalize">{getFileType(material.material_url)}</p>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === materials.length - 1}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => handleDelete(material.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">📁</p>
          <p className="text-sm">No materials added yet</p>
          <p className="text-xs mt-1">Upload images or PDFs for this lesson</p>
        </div>
      )}
    </div>
  )
}