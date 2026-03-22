import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Input, Tabs } from '../../components/ui'

export default function SystemSettings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'Darasaone',
    siteDescription: 'Digital Admin Management Platform for Teachers',
    supportEmail: 'support@darasaone.com',
    maintenanceMode: false,
    requireApproval: true,
    allowFreeCourses: true,
    maxFileSize: 50,
    allowedFileTypes: 'jpg,png,mp4,pdf'
  })

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      navigate('/')
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('Settings saved successfully')
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'content', label: 'Content' },
    { id: 'security', label: 'Security' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-red-600">Darasaone Admin</h1>
            <div className="flex gap-4">
              <Link to="/admin" className="text-gray-600 hover:text-red-600">Dashboard</Link>
              <Link to="/admin/users" className="text-gray-600 hover:text-red-600">Users</Link>
              <Link to="/admin/courses" className="text-gray-600 hover:text-red-600">Courses</Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-red-600">Reports</Link>
              <Link to="/admin/settings" className="text-red-600 font-medium">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">System Settings</h1>
            <p className="text-red-100">Configure platform settings and preferences</p>
          </div>

          {/* Settings Form */}
          <Card>
            <Tabs tabs={tabs} defaultTab="general">
              {/* General Settings */}
              <div id="general" className="space-y-4">
                <Input
                  label="Site Name"
                  name="siteName"
                  value={settings.siteName}
                  onChange={handleInputChange}
                  placeholder="Enter site name"
                />
                
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Site Description</label>
                  <textarea
                    name="siteDescription"
                    value={settings.siteDescription}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter site description"
                  />
                </div>

                <Input
                  label="Support Email"
                  name="supportEmail"
                  type="email"
                  value={settings.supportEmail}
                  onChange={handleInputChange}
                  placeholder="support@example.com"
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Enable Maintenance Mode</label>
                </div>
              </div>

              {/* Content Settings */}
              <div id="content" className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireApproval"
                    checked={settings.requireApproval}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Require admin approval for new courses</label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="allowFreeCourses"
                    checked={settings.allowFreeCourses}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Allow free courses</label>
                </div>

                <Input
                  label="Max File Size (MB)"
                  name="maxFileSize"
                  type="number"
                  value={settings.maxFileSize}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                />

                <Input
                  label="Allowed File Types"
                  name="allowedFileTypes"
                  value={settings.allowedFileTypes}
                  onChange={handleInputChange}
                  placeholder="jpg,png,mp4,pdf"
                />
                <p className="text-sm text-gray-500">Comma-separated list of allowed file extensions</p>
              </div>

              {/* Security Settings */}
              <div id="security" className="space-y-4">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        Security settings should be configured with caution
                      </p>
                    </div>
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  Change Admin Password
                </Button>

                <Button variant="outline" size="sm">
                  Configure Two-Factor Authentication
                </Button>

                <Button variant="outline" size="sm">
                  View Security Logs
                </Button>
              </div>
            </Tabs>

            <div className="mt-6 flex justify-end gap-4">
              <Button variant="outline" onClick={() => navigate('/admin')}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
