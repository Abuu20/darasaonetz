import CloudinaryUpload from './CloudinaryUpload'

export default function PDFUpload({ onUploadComplete, folder = 'course-materials', existingUrl = null, label = 'Upload PDF' }) {
  return (
    <CloudinaryUpload
      onUploadComplete={onUploadComplete}
      folder={folder}
      label={label}
      existingUrl={existingUrl}
      accept="application/pdf"
    />
  )
}
