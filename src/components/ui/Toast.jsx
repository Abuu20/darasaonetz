import { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  const { isDark } = useTheme()
  const [scale, setScale] = useState(0.3)
  const [phase, setPhase] = useState('opening')

  useEffect(() => {
    // PHASE 1: Opening animation (grow from 0.3 to 1)
    const openInterval = setInterval(() => {
      setScale(prev => {
        if (prev >= 1) {
          clearInterval(openInterval)
          // PHASE 2: Stay open for reading (duration time)
          setTimeout(() => {
            setPhase('closing')
            // PHASE 3: Closing animation (shrink from 1 to 0)
            const closeInterval = setInterval(() => {
              setScale(prev => {
                if (prev <= 0) {
                  clearInterval(closeInterval)
                  onClose()
                  return 0
                }
                return prev - 0.05
              })
            }, 20)
          }, duration)
          return 1
        }
        return prev + 0.05
      })
    }, 20)

    return () => {
      clearInterval(openInterval)
    }
  }, [duration, onClose])

  const icons = {
    success: '🎉',
    error: '💔',
    warning: '🌙',
    info: '✨'
  }

  const gradients = {
    success: 'from-emerald-500 via-green-500 to-teal-500',
    error: 'from-rose-500 via-red-500 to-pink-500',
    warning: 'from-amber-500 via-yellow-500 to-orange-500',
    info: 'from-indigo-500 via-purple-500 to-blue-500'
  }

  const shadows = {
    success: 'shadow-emerald-500/30',
    error: 'shadow-rose-500/30',
    warning: 'shadow-amber-500/30',
    info: 'shadow-purple-500/30'
  }

  // Text color based on theme
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const textShadow = isDark ? 'drop-shadow-lg' : 'drop-shadow-sm'

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div 
        className={`
          ${gradients[type]} 
          px-8 py-5 rounded-2xl 
          shadow-2xl ${shadows[type]} 
          flex items-center gap-4 
          min-w-[320px] max-w-md 
          pointer-events-auto 
          border border-white/30 
          backdrop-blur-md
          relative
        `}
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.02s linear',
          animation: 'slideUp 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      >
        {/* Portal Rings around toast */}
        <div className="absolute inset-[-25px] rounded-2xl border-2 border-cyan-500/40 animate-spin-slow" />
        <div className="absolute inset-[-15px] rounded-2xl border-2 border-purple-500/40 animate-spin-reverse" />
        <div className="absolute inset-[-8px] rounded-2xl border-2 border-pink-500/40 animate-spin-slow" style={{ animationDuration: '2s' }} />

        {/* Icon with portal effect */}
        <div className="relative">
          <span className="text-3xl animate-bounce-subtle">{icons[type]}</span>
          <div className="absolute inset-0 animate-ping-slow opacity-30">
            <span className="text-3xl">{icons[type]}</span>
          </div>
        </div>
        
        {/* Message - DYNAMIC TEXT COLOR FOR LIGHT/DARK MODE */}
        <div className="flex-1">
          <p className={`text-base font-bold tracking-wide ${textColor} ${textShadow}`}>
            {message}
          </p>
        </div>
        
        {/* Quantum close button - DYNAMIC COLOR */}
        <button 
          onClick={() => {
            const interval = setInterval(() => {
              setScale(prev => {
                if (prev <= 0) {
                  clearInterval(interval)
                  onClose()
                  return 0
                }
                return prev - 0.1
              })
            }, 20)
          }} 
          className={`ml-2 hover:rotate-90 transition-all duration-300 hover:scale-110 ${
            isDark ? 'text-white/80 hover:text-white' : 'text-gray-700/80 hover:text-gray-900'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Energy particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1.5 h-1.5 bg-cyan-400 rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        
        @keyframes ping-slow {
          0% {
            transform: scale(1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes particle {
          0%, 100% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          50% {
            transform: translateY(-20px) scale(2);
            opacity: 1;
          }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 0.6s ease-in-out infinite;
        }
        
        .animate-ping-slow {
          animation: ping-slow 1.5s ease-in-out infinite;
        }
        
        .animate-spin-slow {
          animation: spin-slow 4s linear infinite;
        }
        
        .animate-spin-reverse {
          animation: spin-reverse 3s linear infinite;
        }
        
        .animate-particle {
          animation: particle 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}