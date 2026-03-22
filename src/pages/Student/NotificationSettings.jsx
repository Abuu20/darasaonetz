import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Card, Button, Spinner } from '../../components/ui'

export default function NotificationSettings() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    email_enrollment: true,
    email_review: true,
    email_course_approved: true,
    email_lesson_completion: true,
    email_newsletter: false,
    push_enrollment: true,
    push_review: true,
    push_course_approved: true,
    push_lesson_completion: true
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_settings')
        .eq('id', user.id)
        .single()

      if (data?.notification_settings) {
        setSettings(prev => ({ ...prev, ...data.notification_settings }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          notification_settings: settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Notification Settings</h1>
      
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Email Notifications</h2>
        </Card.Header>
        <Card.Body className="space-y-4">
          <label className="flex items-center justify-between">
            <span>Course enrollment confirmations</span>
            <input
              type="checkbox"
              checked={settings.email_enrollment}
              onChange={() => toggleSetting('email_enrollment')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>New reviews on your courses</span>
            <input
              type="checkbox"
              checked={settings.email_review}
              onChange={() => toggleSetting('email_review')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>Course approval updates</span>
            <input
              type="checkbox"
              checked={settings.email_course_approved}
              onChange={() => toggleSetting('email_course_approved')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>Lesson completion reminders</span>
            <input
              type="checkbox"
              checked={settings.email_lesson_completion}
              onChange={() => toggleSetting('email_lesson_completion')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>Newsletter and updates</span>
            <input
              type="checkbox"
              checked={settings.email_newsletter}
              onChange={() => toggleSetting('email_newsletter')}
              className="w-5 h-5"
            />
          </label>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Push Notifications</h2>
        </Card.Header>
        <Card.Body className="space-y-4">
          <label className="flex items-center justify-between">
            <span>New enrollments</span>
            <input
              type="checkbox"
              checked={settings.push_enrollment}
              onChange={() => toggleSetting('push_enrollment')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>New reviews</span>
            <input
              type="checkbox"
              checked={settings.push_review}
              onChange={() => toggleSetting('push_review')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>Course updates</span>
            <input
              type="checkbox"
              checked={settings.push_course_approved}
              onChange={() => toggleSetting('push_course_approved')}
              className="w-5 h-5"
            />
          </label>
          
          <label className="flex items-center justify-between">
            <span>Lesson completion</span>
            <input
              type="checkbox"
              checked={settings.push_lesson_completion}
              onChange={() => toggleSetting('push_lesson_completion')}
              className="w-5 h-5"
            />
          </label>
        </Card.Body>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}
