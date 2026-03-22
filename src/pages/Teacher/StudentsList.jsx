import { useState, useEffect } from 'react'
import { teacherQueries } from '../../supabase/queries/users'
import { useAuth } from '../../context/AuthContext'
import { Card, Input, Table, Avatar, Spinner } from '../../components/ui'

export default function StudentsList() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (user) {
      fetchStudents()
    }
  }, [user])

  async function fetchStudents() {
    try {
      const data = await teacherQueries.getStudents(user.id)
      setStudents(data)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My Students</h1>

      <Card>
        <div className="mb-4">
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <Table.Head>
            <Table.Row>
              <Table.Header>Student</Table.Header>
              <Table.Header>Email</Table.Header>
              <Table.Header>Enrolled Courses</Table.Header>
              <Table.Header>Completed</Table.Header>
              <Table.Header>Avg. Progress</Table.Header>
            </Table.Row>
          </Table.Head>
          <Table.Body>
            {filteredStudents.map(student => (
              <Table.Row key={student.id}>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar src={student.avatar_url} alt={student.full_name} size="sm" />
                    <span>{student.full_name}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>{student.email}</Table.Cell>
                <Table.Cell>{student.courses.length}</Table.Cell>
                <Table.Cell>{student.completedCourses}</Table.Cell>
                <Table.Cell>{Math.round(student.averageProgress)}%</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>

        {filteredStudents.length === 0 && (
          <p className="text-center py-8 text-gray-500">No students found</p>
        )}
      </Card>
    </div>
  )
}
