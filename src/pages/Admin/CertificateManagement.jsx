import { useState, useEffect } from 'react'
import { certificateQueries } from '../../supabase/queries/certificates'
import { Card, Button, Spinner, Table, Avatar } from '../../components/ui'

export default function CertificateManagement() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0 })

  useEffect(() => {
    fetchCertificates()
    fetchStats()
  }, [])

  async function fetchCertificates() {
    try {
      const data = await certificateQueries.getAllCertificates()
      setCertificates(data)
    } catch (error) {
      console.error('Error fetching certificates:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const data = await certificateQueries.getAllCertificates()
      setStats({ total: data.length })
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
      <div className="bg-gradient-to-r from-red-600 to-red-800 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Certificate Management</h1>
        <p className="text-red-100">Manage all certificates issued on the platform</p>
      </div>

      {/* Stats Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <h3 className="text-gray-500 text-sm mb-1">Total Certificates</h3>
          <p className="text-3xl font-bold text-red-600">{stats.total}</p>
        </Card>
      </div>

      {/* Certificates Table */}
      <Card>
        <Card.Header>
          <h2 className="text-xl font-semibold">All Certificates</h2>
        </Card.Header>
        <Card.Body>
          {certificates.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Head>
                  <Table.Row>
                    <Table.Header>Student</Table.Header>
                    <Table.Header>Course</Table.Header>
                    <Table.Header>Teacher</Table.Header>
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
                      <Table.Cell>{cert.courses?.profiles?.full_name || 'Teacher'}</Table.Cell>
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
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-4xl mb-4">🎓</p>
              <p className="text-gray-500">No certificates issued yet</p>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}
