import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../supabase/client'
import { Card, Button, Spinner, Input, Select, Table, Modal } from '../../components/ui'

export default function UserManagement() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [adminCheck, setAdminCheck] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    if (adminCheck) {
      fetchUsers()
    }
  }, [adminCheck])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, users])

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
        alert('Access denied. Admin only.')
        navigate('/')
        return
      }

      setAdminCheck(true)
    } catch (error) {
      console.error('Error checking admin access:', error)
      navigate('/')
    }
  }

  async function fetchUsers() {
    try {
      setLoading(true)
      
      // Fetch all profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      console.log('Fetched users:', data) // Debug log
      setUsers(data || [])
      setFilteredUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
      alert('Failed to fetch users: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  function filterUsers() {
    let filtered = [...users]

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
      
      alert('User role updated successfully')
    } catch (error) {
      console.error('Error updating user role:', error)
      alert('Failed to update user role: ' + error.message)
    }
  }

  async function handleDeleteUser(userId) {
    try {
      // First delete from profiles (this will cascade or you need to handle)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Then try to delete from auth (requires admin privileges)
      const { error: authError } = await supabase.auth.admin.deleteUser(userId)
      
      if (authError) {
        console.warn('Auth user may still exist:', authError)
      }

      setUsers(users.filter(user => user.id !== userId))
      setShowDeleteModal(false)
      alert('User deleted successfully')
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <h1 className="text-2xl font-bold text-red-600">Darasaone Admin</h1>
            <div className="flex gap-4">
              <Link to="/admin" className="text-gray-600 hover:text-red-600">Dashboard</Link>
              <Link to="/admin/users" className="text-red-600 font-medium">Users</Link>
              <Link to="/admin/courses" className="text-gray-600 hover:text-red-600">Courses</Link>
              <Link to="/admin/reports" className="text-gray-600 hover:text-red-600">Reports</Link>
              <Link to="/admin/settings" className="text-gray-600 hover:text-red-600">Settings</Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
            <h1 className="text-3xl font-bold mb-2">User Management</h1>
            <p className="text-red-100">Manage teachers, students, and administrators</p>
          </div>

          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Search Users"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or email..."
              />
              <Select
                label="Filter by Role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Roles' },
                  { value: 'admin', label: 'Admins' },
                  { value: 'teacher', label: 'Teachers' },
                  { value: 'student', label: 'Students' }
                ]}
              />
              <div className="flex items-end">
                <p className="text-sm text-gray-500">
                  Showing {filteredUsers.length} of {users.length} users
                </p>
              </div>
            </div>
          </Card>

          {/* Users Table */}
          <Card>
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Header>User</Table.Header>
                  <Table.Header>Email</Table.Header>
                  <Table.Header>Role</Table.Header>
                  <Table.Header>Joined</Table.Header>
                  <Table.Header>Actions</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {filteredUsers.map(user => (
                  <Table.Row key={user.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full" />
                          ) : (
                            <span className="text-sm">{user.full_name?.charAt(0) || '?'}</span>
                          )}
                        </div>
                        <span className="font-medium">{user.full_name || 'No name'}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{user.email}</Table.Cell>
                    <Table.Cell>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1 border rounded text-sm"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </Table.Cell>
                    <Table.Cell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => {
                          setSelectedUser(user)
                          setShowDeleteModal(true)
                        }}
                      >
                        Delete
                      </Button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>

            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this user?</p>
          {selectedUser && (
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Name:</strong> {selectedUser.full_name}</p>
              <p><strong>Email:</strong> {selectedUser.email}</p>
              <p><strong>Role:</strong> {selectedUser.role}</p>
            </div>
          )}
          <p className="text-sm text-red-600">This action cannot be undone.</p>
          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={() => handleDeleteUser(selectedUser?.id)}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
