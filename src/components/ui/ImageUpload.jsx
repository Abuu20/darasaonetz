import CloudinaryUpload from './CloudinaryUpload'

export default function ImageUpload({ onUploadComplete, folder = 'course-thumbnails', existingUrl = null, label = 'Upload Course Thumbnail' }) {
  return (
    <CloudinaryUpload
      onUploadComplete={onUploadComplete}
      folder={folder}
      label={label}
      existingUrl={existingUrl}
      accept="image/*"
    />
  )
}
