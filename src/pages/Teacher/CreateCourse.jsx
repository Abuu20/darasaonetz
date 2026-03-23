import { CourseForm } from '../../components/forms'

export default function CreateCourse() {
  const handleSuccess = () => {
    // Only navigate to teacher dashboard, no enrollment
    console.log('Course created successfully')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <CourseForm onSuccess={handleSuccess} />
    </div>
  )
}
