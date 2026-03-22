import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { certificateQueries } from '../../supabase/queries/certificates'
import { Card, Button, Spinner, Table, Avatar } from '../../components/ui'

export default function TeacherCertificates() {
  const { user } = useAuth()
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, byCourse: [] })

  useEffect(() => {
    if (user) {
      fetchCertificates()
      fetchStats()
    }
  }, [user])

  async function fetchCertificates() {
    try {
      const data = await certificateQueries.getTeacherCertificates(user.id)
      setCertificates(data)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const data = await certificateQueries.getTeacherCertificateStats(user.id)
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Certificates Issued</h1>
        <p className="text-purple-100">Track certificates awarded to students</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Total Certificates Issued</h3>
          <p className="text-3xl font-bold text-purple-600">{stats.total}</p>
        </Card>
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Courses with Certificates</h3>
          <p className="text-3xl font-bold text-green-600">{stats.byCourse.length}</p>
        </Card>
      </div>

      {/* Certificates Table */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">Recent Certificates</h2>
        </Card.Header>
        <Card.Body>
          {certificates.length > 0 ? (
            <Table>
              <Table.Head>
                <Table.Row>
                  <Table.Header>Student</Table.Header>
                  <Table.Header>Course</Table.Header>
                  <Table.Header>Certificate #</Table.Header>
                  <Table.Header>Issue Date</Table.Header>
                  <Table.Header>Downloads</Table.Header>
                  <Table.Header>Shares</Table.Header>
                </Table.Row>
              </Table.Head>
              <Table.Body>
                {certificates.map(cert => (
                  <Table.Row key={cert.id}>
                    <Table.Cell>
                      <div className="flex items-center gap-2">
                        <Avatar src={cert.profiles?.avatar_url} alt={cert.profiles?.full_name} size="sm" />
                        <span>{cert.profiles?.full_name || 'Student'}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>{cert.courses?.title}</Table.Cell>
                    <Table.Cell>
                      <span className="font-mono text-xs">{cert.certificate_number}</span>
                    </Table.Cell>
                    <Table.Cell>{new Date(cert.issue_date).toLocaleDateString()}</Table.Cell>
                    <Table.Cell>{cert.download_count || 0}</Table.Cell>
                    <Table.Cell>{cert.share_count || 0}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-4">🎓</p>
              <p className="text-gray-500">No certificates issued yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Certificates will appear here when students complete your courses
              </p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
