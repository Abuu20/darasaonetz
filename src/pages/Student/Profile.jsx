import { useAuth } from '../../context/AuthContext'
import { ProfileForm } from '../../components/forms'
import { Spinner } from '../../components/ui'

export default function StudentProfile() {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        <ProfileForm userRole="student" />
      </div>
    </div>
  )
}
