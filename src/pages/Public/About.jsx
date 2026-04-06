import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../supabase/client'
import { Card, Spinner } from '../../components/ui'
import ImageModal from '../../components/ui/ImageModal'

export default function About() {
  const { t, i18n } = useTranslation()
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [selectedMember, setSelectedMember] = useState(null)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  async function fetchTeamMembers() {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { label: t('about.stats.students'), value: '10,000+' },
    { label: t('about.stats.teachers'), value: '5+' },
    { label: t('about.stats.courses'), value: '10+' },
    { label: t('about.stats.hours'), value: '1,500+' }
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-12 md:space-y-16 px-4 sm:px-6 py-8 md:py-12">
      {/* Hero Section */}
      <section className="text-center py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6">
          {t('about.title')} <span className="text-blue-600">{t('about.titleHighlight')}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto px-4">
          {t('about.subtitle')}
        </p>
      </section>

      {/* Mission Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-6 md:p-8 lg:p-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t('about.mission.title')}</h2>
          <p className="text-base md:text-xl leading-relaxed">
            {t('about.mission.text')}
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">{t('about.stats.title')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center p-4 md:p-6">
              <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {stat.value}
              </div>
              <div className="text-sm md:text-base text-gray-600 dark:text-gray-300">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{t('about.story.title')}</h2>
          <div className="space-y-3 md:space-y-4 text-gray-600 dark:text-gray-300 text-sm md:text-base">
            <p>{t('about.story.paragraph1')}</p>
            <p>{t('about.story.paragraph2')}</p>
            <p>{t('about.story.paragraph3')}</p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-6 md:p-8 text-white">
          <div className="text-4xl md:text-6xl mb-3 md:mb-4">📚</div>
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">{t('about.join.title')}</h3>
          <p className="text-sm md:text-base mb-4 md:mb-6">
            {t('about.join.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <Link
              to="/register?role=teacher"
              className="bg-white text-blue-600 px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition text-center text-sm md:text-base"
            >
              {t('about.join.teachButton')}
            </Link>
            <Link
              to="/register?role=student"
              className="border-2 border-white text-white px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition text-center text-sm md:text-base"
            >
              {t('about.join.learnButton')}
            </Link>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section>
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-12">{t('about.team.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {teamMembers.map((member) => (
            <Card key={member.id} className="text-center p-4 md:p-6 hover:shadow-lg transition-shadow">
              <div 
                className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-3xl md:text-4xl overflow-hidden cursor-pointer group relative"
                onClick={() => {
                  if (member.avatar_url) {
                    setSelectedImage(member.avatar_url)
                    setSelectedMember(member)
                  }
                }}
              >
                {member.avatar_url ? (
                  <>
                    <img 
                      src={member.avatar_url} 
                      alt={member.name} 
                      className="w-full h-full rounded-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </>
                ) : (
                  <span className="text-4xl">{member.name.charAt(0)}</span>
                )}
              </div>
              
              <h3 className="text-lg md:text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-blue-600 dark:text-blue-400 text-sm md:text-base mb-2">{member.role}</p>
              {member.expertise && (
                <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-2">{member.expertise}</p>
              )}
              {/* Display bio based on selected language */}
              <p className="text-gray-600 dark:text-gray-300 text-xs md:text-sm leading-relaxed">
                {i18n.language === 'sw' && member.bio_sw ? member.bio_sw : member.bio}
              </p>
            </Card>
          ))}
        </div>
        
        {teamMembers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-4">👥</p>
            <p className="text-gray-500">Team members will appear here soon</p>
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-6 md:p-8 lg:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">{t('about.cta.title')}</h2>
        <p className="text-base md:text-xl text-gray-600 dark:text-gray-300 mb-6 md:mb-8">
          {t('about.cta.description')}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
          <Link to="/register">
            <button className="bg-blue-600 text-white px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-blue-700 transition w-full sm:w-auto text-sm md:text-base">
              {t('about.cta.signupButton')}
            </button>
          </Link>
          <Link to="/student/browse">
            <button className="border-2 border-blue-600 text-blue-600 px-6 md:px-8 py-2 md:py-3 rounded-lg font-semibold hover:bg-blue-50 transition w-full sm:w-auto text-sm md:text-base">
              {t('about.cta.browseButton')}
            </button>
          </Link>
        </div>
      </section>

      {/* Image Modal */}
      <ImageModal
        isOpen={!!selectedImage}
        onClose={() => {
          setSelectedImage(null)
          setSelectedMember(null)
        }}
        imageUrl={selectedImage}
        altText={selectedMember?.name || 'Team member'}
      />
    </div>
  )
}