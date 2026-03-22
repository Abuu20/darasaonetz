import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { validateProfile } from '../../utils/validators'
import { Input, Button, Card, Avatar, Tabs } from '../ui'
import ImageUpload from '../ui/ImageUpload'

export default function ProfileForm({ userRole = 'student' }) {
  const { profile, updateProfile, loading: authLoading } = useAuth()
  const { showError, showSuccess } = useTheme()
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
    expertise: '',
    qualifications: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarUrl, setAvatarUrl] = useState('')

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        expertise: profile.expertise || '',
        qualifications: profile.qualifications || ''
      })
      setAvatarUrl(profile.avatar_url || '')
    }
  }, [profile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const handleAvatarUpload = (url) => {
    setAvatarUrl(url)
    // Auto-update avatar
    handleAvatarUpdate(url)
  }

  const handleAvatarUpdate = async (url) => {
    try {
      const result = await updateProfile({ avatar_url: url })
      if (!result.success) {
        showError('Failed to update avatar')
      } else {
        showSuccess('Avatar updated successfully')
      }
    } catch (error) {
      showError('Failed to update avatar')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validate form
    const validation = validateProfile(formData)
    if (!validation.isValid) {
      setErrors(validation.errors)
      return
    }

    setLoading(true)
    
    try {
      const result = await updateProfile(formData)
      
      if (result.success) {
        showSuccess('Profile updated successfully!')
      } else {
        showError(result.error || 'Failed to update profile')
        setErrors({ general: result.error })
      }
    } catch (error) {
      showError('An unexpected error occurred')
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile Information' },
    { id: 'security', label: 'Security' },
    ...(userRole === 'teacher' ? [{ id: 'teacher', label: 'Teaching Info' }] : [])
  ]

  return (
    <Card>
      <Card.Header>
        <h2 className="text-xl font-semibold">Edit Profile</h2>
      </Card.Header>

      <Card.Body>
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
            {errors.general}
          </div>
        )}

        <Tabs tabs={tabs} defaultTab="profile" onChange={setActiveTab}>
          {/* Profile Information Tab */}
          <div id="profile" className="space-y-6">
            <div className="flex items-center gap-6">
              <Avatar 
                src={avatarUrl} 
                alt={formData.full_name}
                size="xl"
              />
              <div className="flex-1">
                <ImageUpload
                  label="Profile Picture"
                  onUploadComplete={handleAvatarUpload}
                  folder="avatars"
                  existingUrl={avatarUrl}
                />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                error={errors.full_name}
                required
                disabled={loading || authLoading}
              />

              <Input
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter your phone number"
                error={errors.phone}
                disabled={loading || authLoading}
              />

              <div>
                <label className="block text-gray-700 mb-2">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Tell us about yourself..."
                  disabled={loading || authLoading}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  variant="primary" 
                  disabled={loading || authLoading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>

          {/* Security Tab */}
          <div id="security" className="space-y-6">
            <h3 className="text-lg font-semibold">Change Password</h3>
            
            <form className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
              />
              
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
              />
              
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
              />
              
              <Button variant="primary" type="button">
                Update Password
              </Button>
            </form>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
              <Button variant="danger" type="button">
                Delete Account
              </Button>
            </div>
          </div>

          {/* Teacher Info Tab */}
          {userRole === 'teacher' && (
            <div id="teacher" className="space-y-4">
              <Input
                label="Area of Expertise"
                name="expertise"
                value={formData.expertise}
                onChange={handleChange}
                placeholder="e.g., Quran, Tajweed, Arabic"
                disabled={loading || authLoading}
              />

              <div>
                <label className="block text-gray-700 mb-2">Qualifications</label>
                <textarea
                  name="qualifications"
                  value={formData.qualifications}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="List your qualifications and certifications..."
                  disabled={loading || authLoading}
                />
              </div>

              <Button 
                variant="primary" 
                onClick={handleSubmit}
                disabled={loading || authLoading}
              >
                Save Teaching Info
              </Button>
            </div>
          )}
        </Tabs>
      </Card.Body>
    </Card>
  )
}
