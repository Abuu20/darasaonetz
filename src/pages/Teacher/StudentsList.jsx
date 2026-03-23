import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../supabase/client'
import { useAuth } from '../../context/AuthContext'
import { Input, Table, Avatar, Spinner, Button } from '../../components/ui'

export default function StudentsList() {
  const { user } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedStudent, setExpandedStudent] = useState(null)
  const fetched = useRef(false)

  useEffect(() => {
    if (user && !fetched.current) {
      fetched.current = true
      fetchStudents()
    }
  }, [user])

  async function fetchStudents() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          courses!inner (id, title, level),
          profiles!enrollments_student_id_fkey (id, full_name, email, avatar_url)
        `)
        .eq('courses.teacher_id', user.id)

      if (error) throw error

      if (!data?.length) {
        setStudents([])
        return
      }

      const studentMap = new Map()
      for (const enrollment of data) {
        const student = enrollment.profiles
        if (!student) continue
        
        if (!studentMap.has(student.id)) {
          studentMap.set(student.id, {
            ...student,
            courses: [],
            totalProgress: 0
          })
        }
        
        const s = studentMap.get(student.id)
        const progress = Number(enrollment.progress) || 0
        s.courses.push({
          id: enrollment.course_id,
          title: enrollment.courses?.title,
          level: enrollment.courses?.level,
          progress,
          completed: progress === 100,
          enrolled_at: enrollment.enrolled_at
        })
        s.totalProgress += progress
      }

      const list = Array.from(studentMap.values()).map(s => ({
        ...s,
        enrolledCount: s.courses.length,
        completedCount: s.courses.filter(c => c.completed).length,
        averageProgress: s.courses.length ? s.totalProgress / s.courses.length : 0
      }))

      setStudents(list)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-8"><Spinner size="md" /></div>

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h3 className="text-lg font-semibold">Enrolled Students</h3>
        <Button size="sm" variant="outline" onClick={fetchStudents}>Refresh</Button>
      </div>

      <Input placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />

      {filtered.length ? (
        <div className="overflow-x-auto">
          <Table>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Student</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Courses</th>
                <th className="px-4 py-3 text-left">Completed</th>
                <th className="px-4 py-3 text-left">Progress</th>
                <th className="px-4 py-3 text-left"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <>
                  <tr key={s.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={s.avatar_url} size="sm" />
                        <span className="font-medium">{s.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{s.email}</td>
                    <td className="px-4 py-3">{s.enrolledCount}</td>
                    <td className="px-4 py-3">{s.completedCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 w-32">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full">
                          <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${Math.round(s.averageProgress)}%` }} />
                        </div>
                        <span className="text-sm">{Math.round(s.averageProgress)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => setExpandedStudent(expandedStudent === s.id ? null : s.id)}>
                        {expandedStudent === s.id ? 'Hide' : 'View Courses'}
                      </Button>
                    </td>
                  </tr>
                  {expandedStudent === s.id && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="px-4 py-3">
                        <div className="space-y-2">
                          {s.courses.map(c => (
                            <div key={c.id} className="flex justify-between items-center border-b pb-2">
                              <div>
                                <p className="font-medium">{c.title}</p>
                                <p className="text-sm text-gray-500 capitalize">{c.level}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="w-32 h-2 bg-gray-200 rounded-full">
                                  <div className="h-2 bg-green-500 rounded-full" style={{ width: `${c.progress}%` }} />
                                </div>
                                <span className="text-sm w-12">{Math.round(c.progress)}%</span>
                                {c.completed && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">✓ Completed</span>}
                                <span className="text-xs text-gray-400">{new Date(c.enrolled_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-4xl mb-2">👥</p>
          <p className="text-gray-500">No students enrolled yet</p>
        </div>
      )}
    </div>
  )
}
