import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Input, Table, Modal, Avatar } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import ImageModal from '../../components/ui/ImageModal'

export default function TeamManagement() {
  const { showSuccess, showError, showInfo } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState(null)
  const [previewMember, setPreviewMember] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    bio: '',
    expertise: '',
    display_order: 0,
    is_active: true
  })
  const [selectedFile, setSelectedFile] = useState(null)

  useEffect(() => {
    checkAdminAccess()
    fetchTeamMembers()
  }, [])

  async function checkAdminAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (profile?.role !== 'admin') {
        showInfo('Access denied. Admin only.')
        navigate('/')
      }
    } catch (error) {
      navigate('/')
    }
  }

  async function fetchTeamMembers() {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      showError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  async function uploadAvatar(file, memberId) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${memberId}/${Date.now()}.${fileExt}`
    const filePath = fileName

    const { error } = await supabase.storage
      .from('team-avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      })

    if (error) throw new Error('Failed to upload image')

    const { data: { publicUrl } } = supabase.storage
      .from('team-avatars')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showError('Name is required')
      return
    }
    if (!formData.role.trim()) {
      showError('Role is required')
      return
    }

    try {
      setUploading(true)
      
      let avatarUrl = editingMember?.avatar_url || null
      
      if (selectedFile) {
        try {
          const tempId = editingMember?.id || `temp_${Date.now()}`
          avatarUrl = await uploadAvatar(selectedFile, tempId)
        } catch (uploadError) {
          showError('Failed to upload image')
          setUploading(false)
          return
        }
      }

      const memberData = {
        name: formData.name.trim(),
        role: formData.role.trim(),
        bio: formData.bio || '',
        expertise: formData.expertise || '',
        display_order: parseInt(formData.display_order) || 0,
        is_active: formData.is_active,
        avatar_url: avatarUrl
      }

      if (editingMember) {
        const { error } = await supabase
          .from('team_members')
          .update({
            ...memberData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingMember.id)

        if (error) throw error
        showSuccess('Team member updated successfully')
      } else {
        const { data, error } = await supabase
          .from('team_members')
          .insert([memberData])
          .select()

        if (error) throw error

        if (selectedFile && data && data[0] && data[0].id) {
          try {
            const newAvatarUrl = await uploadAvatar(selectedFile, data[0].id)
            await supabase
              .from('team_members')
              .update({ avatar_url: newAvatarUrl })
              .eq('id', data[0].id)
          } catch (updateError) {
            // Silent fail - image already saved with temp ID
          }
        }
        
        showSuccess('Team member added successfully')
      }

      setShowModal(false)
      resetForm()
      fetchTeamMembers()
    } catch (error) {
      showError('Failed to save team member')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(member) {
    if (!confirm(`Delete ${member.name}? This action cannot be undone.`)) return

    try {
      if (member.avatar_url) {
        try {
          const urlParts = member.avatar_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const path = `${member.id}/${fileName}`
          
          await supabase.storage
            .from('team-avatars')
            .remove([path])
        } catch (storageError) {
          // Continue with deletion even if storage delete fails
        }
      }

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', member.id)

      if (error) throw error
      showSuccess('Team member deleted successfully')
      fetchTeamMembers()
    } catch (error) {
      showError('Failed to delete team member')
    }
  }

  function resetForm() {
    setEditingMember(null)
    setFormData({
      name: '',
      role: '',
      bio: '',
      expertise: '',
      display_order: 0,
      is_active: true
    })
    setSelectedFile(null)
  }

  function editMember(member) {
    setEditingMember(member)
    setFormData({
      name: member.name || '',
      role: member.role || '',
      bio: member.bio || '',
      expertise: member.expertise || '',
      display_order: member.display_order || 0,
      is_active: member.is_active !== false
    })
    setShowModal(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Team Management</h1>
              <p className="text-red-100">Manage the team members displayed on the About page</p>
            </div>
            <Button 
              variant="primary" 
              onClick={() => {
                resetForm()
                setShowModal(true)
              }}
            >
              + Add Team Member
            </Button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avatar</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map(member => (
                  <tr key={member.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div 
                        className="cursor-pointer group relative"
                        onClick={() => {
                          if (member.avatar_url) {
                            setPreviewImage(member.avatar_url)
                            setPreviewMember(member)
                          }
                        }}
                      >
                        <Avatar 
                          src={member.avatar_url} 
                          alt={member.name} 
                          size="md"
                        />
                        {member.avatar_url && (
                          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold">{member.name}</p>
                        {member.expertise && (
                          <p className="text-xs text-gray-500">{member.expertise}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">{member.role}</td>
                    <td className="px-6 py-4">{member.display_order}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        member.is_active 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {member.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => editMember(member)}>
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(member)}>
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {teamMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-4xl mb-4">👥</p>
              <p className="text-gray-500">No team members added yet</p>
              <Button 
                variant="primary" 
                className="mt-4"
                onClick={() => setShowModal(true)}
              >
                Add Your First Team Member
              </Button>
            </div>
          )}
        </Card>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={editingMember ? 'Edit Team Member' : 'Add Team Member'}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto p-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                {selectedFile ? (
                  <img 
                    src={URL.createObjectURL(selectedFile)} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : editingMember?.avatar_url ? (
                  <img 
                    src={editingMember.avatar_url} 
                    alt={editingMember.name} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-gray-400">📷</span>
                )}
              </div>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  label="Profile Image"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: Square image, 200x200px (Max 2MB)
                </p>
              </div>
            </div>

            <Input
              label="Full Name *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="e.g., Khalifa Simion"
              required
            />

            <Input
              label="Role / Position *"
              value={formData.role}
              onChange={(e) => setFormData({...formData, role: e.target.value})}
              placeholder="e.g., Quran & Islamic Studies Teacher"
              required
            />

            <Input
              label="Expertise (optional)"
              value={formData.expertise}
              onChange={(e) => setFormData({...formData, expertise: e.target.value})}
              placeholder="e.g., Quranic Sciences | Tajweed | Egyptian Graduate"
            />

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Bio / Description</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Brief description about this team member..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Display Order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({...formData, display_order: parseInt(e.target.value) || 0})}
                placeholder="0, 1, 2..."
              />
              
              <div className="flex items-center mt-6">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="mr-2 w-4 h-4"
                />
                <label className="text-gray-700">Active (visible on site)</label>
              </div>
            </div>

            <div className="flex gap-4 justify-end mt-6 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSave}
                disabled={uploading || !formData.name || !formData.role}
              >
                {uploading ? 'Saving...' : editingMember ? 'Update' : 'Add Member'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>

      <ImageModal
        isOpen={!!previewImage}
        onClose={() => {
          setPreviewImage(null)
          setPreviewMember(null)
        }}
        imageUrl={previewImage}
        altText={previewMember?.name || 'Team member'}
      />
    </>
  )
}