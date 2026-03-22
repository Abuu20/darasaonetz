import { useContext } from 'react'
import AuthContext from '../context/AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Additional auth-specific hooks
export const useRequireAuth = (redirectTo = '/login') => {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!loading && !user) {
      navigate(redirectTo)
    }
  }, [user, loading, navigate, redirectTo])
  
  return { user, loading }
}

export const useRequireRole = (requiredRole, redirectTo = '/') => {
  const { user, profile, loading } = useAuth()
  const navigate = useNavigate()
  
  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login')
      } else if (profile?.role !== requiredRole) {
        navigate(redirectTo)
      }
    }
  }, [user, profile, loading, navigate, requiredRole, redirectTo])
  
  return { user, profile, loading }
}

export const useProfile = () => {
  const { profile, updateProfile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState(profile || {})
  
  useEffect(() => {
    if (profile) {
      setFormData(profile)
    }
  }, [profile])
  
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    const result = await updateProfile(formData)
    if (result.success) {
      setIsEditing(false)
    }
    return result
  }
  
  return {
    profile,
    formData,
    isEditing,
    setIsEditing,
    handleChange,
    handleSubmit,
    loading
  }
}
