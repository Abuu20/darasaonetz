import { Link } from 'react-router-dom'
import { Card } from '../../components/ui'

export default function About() {
  const team = [
    {
      name: 'Dr. Ahmed Hassan',
      role: 'Founder & CEO',
      bio: 'PhD in Islamic Studies with 15+ years of teaching experience',
      image: null
    },
    {
      name: 'Prof. Fatima Al-Sayed',
      role: 'Head of Curriculum',
      bio: 'Expert in Quranic studies and Islamic education',
      image: null
    },
    {
      name: 'Ustadh Ibrahim Khalil',
      role: 'Senior Instructor',
      bio: 'Specializes in Tajweed and Quran memorization',
      image: null
    }
  ]

  const stats = [
    { label: 'Active Students', value: '10,000+' },
    { label: 'Expert Teachers', value: '50+' },
    { label: 'Islamic Courses', value: '200+' },
    { label: 'Hours of Content', value: '1,500+' }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          About <span className="text-blue-600">Darasaone</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Empowering teachers and students with a modern platform for Islamic education
        </p>
      </section>

      {/* Mission Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl p-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
          <p className="text-xl leading-relaxed">
            To make quality Islamic education accessible to everyone, everywhere, 
            by providing teachers with the tools they need to create engaging courses 
            and students with the platform to learn effectively.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">Our Impact</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>

      {/* Story Section */}
      <section className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-600">
            <p>
              Darasaone was founded in 2024 with a simple vision: to bridge the gap 
              between traditional Islamic education and modern technology. We saw that 
              many talented teachers lacked the tools to reach students beyond their 
              local communities.
            </p>
            <p>
              Today, we're building a platform that empowers teachers to create, 
              manage, and sell their courses online, while providing students with 
              a rich, interactive learning experience. From Quran memorization to 
              Arabic grammar, our platform hosts courses on a wide range of Islamic 
              subjects.
            </p>
            <p>
              We believe that education should be accessible, engaging, and effective. 
              That's why we've built features like video lessons, progress tracking, 
              and interactive quizzes to enhance the learning journey.
            </p>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl p-8 text-white">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-2xl font-bold mb-4">Join Our Community</h3>
          <p className="mb-6">
            Whether you're a teacher looking to share your knowledge or a student 
            eager to learn, Darasaone is the place for you.
          </p>
          <div className="flex gap-4">
            <Link
              to="/register?role=teacher"
              className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
            >
              Start Teaching
            </Link>
            <Link
              to="/register?role=student"
              className="border-2 border-white text-white px-6 py-2 rounded-lg font-semibold hover:bg-white hover:text-blue-600"
            >
              Start Learning
            </Link>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section>
        <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {team.map((member, index) => (
            <Card key={index} className="text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-white text-4xl">
                {member.image ? (
                  <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  member.name.charAt(0)
                )}
              </div>
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-blue-600 mb-3">{member.role}</p>
              <p className="text-gray-600 text-sm">{member.bio}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
          Join thousands of students and teachers on Darasaone today
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/register">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700">
              Sign Up Now
            </button>
          </Link>
          <Link to="/student/browse">
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50">
              Browse Courses
            </button>
          </Link>
        </div>
      </section>
    </div>
  )
}
