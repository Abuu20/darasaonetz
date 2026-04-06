import { useEffect, useState } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function Toast({ message, type = 'info', onClose, duration = 3000 }) {
  const { isDark, isMobile } = useTheme()
  const [scale, setScale] = useState(0.3)

  useEffect(() => {
    // PHASE 1: Opening animation (grow from 0.3 to 1)
    const openInterval = setInterval(() => {
      setScale(prev => {
        if (prev >= 1) {
          clearInterval(openInterval)
          // PHASE 2: Stay open for reading (duration time)
          setTimeout(() => {
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

  // Responsive sizing based on device
  const textColor = isDark ? 'text-white' : 'text-gray-900'
  const textShadow = isDark ? 'drop-shadow-lg' : 'drop-shadow-sm'
  
  // Mobile vs Desktop styles - REDUCED MORE FOR MOBILE
  const mobileStyles = isMobile ? {
    padding: 'px-3 py-2',
    gap: 'gap-1.5',
    minWidth: 'min-w-[200px]',
    maxWidth: 'max-w-[280px]',
    iconSize: 'text-lg',
    textSize: 'text-xs',
    ringOffset: {
      outer: 'inset-[-8px]',
      middle: 'inset-[-5px]',
      inner: 'inset-[-2px]'
    },
    borderWidth: 'border',
    ringBorderWidth: 'border',
    particleCount: 3
  } : {
    padding: 'px-8 py-5',
    gap: 'gap-4',
    minWidth: 'min-w-[320px]',
    maxWidth: 'max-w-md',
    iconSize: 'text-3xl',
    textSize: 'text-base',
    ringOffset: {
      outer: 'inset-[-25px]',
      middle: 'inset-[-15px]',
      inner: 'inset-[-8px]'
    },
    borderWidth: 'border-2',
    ringBorderWidth: 'border-2',
    particleCount: 12
  }

  return (
    <div className={`fixed ${isMobile ? 'top-2 left-2 right-2' : 'inset-0 flex items-center justify-center'} z-50 pointer-events-none`}>
      <div 
        className={`
          ${gradients[type]} 
          ${mobileStyles.padding}
          rounded-xl 
          shadow-xl ${shadows[type]} 
          flex items-center ${mobileStyles.gap}
          ${mobileStyles.minWidth} 
          ${mobileStyles.maxWidth}
          pointer-events-auto 
          border border-white/30 
          backdrop-blur-md
          relative
          ${isMobile ? 'w-auto' : ''}
        `}
        style={{
          transform: `scale(${scale})`,
          transition: 'transform 0.02s linear',
          animation: 'slideUp 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
        }}
      >
        {/* Portal Rings around toast - Responsive sizes */}
        <div className={`absolute ${mobileStyles.ringOffset.outer} rounded-xl ${mobileStyles.ringBorderWidth} border-cyan-500/40 animate-spin-slow`} />
        <div className={`absolute ${mobileStyles.ringOffset.middle} rounded-xl ${mobileStyles.ringBorderWidth} border-purple-500/40 animate-spin-reverse`} />
        
        {/* Only show inner ring on desktop */}
        {!isMobile && (
          <div className={`absolute ${mobileStyles.ringOffset.inner} rounded-xl ${mobileStyles.ringBorderWidth} border-pink-500/40 animate-spin-slow`} style={{ animationDuration: '2s' }} />
        )}

        {/* Icon with portal effect */}
        <div className="relative">
          <span className={`${mobileStyles.iconSize} animate-bounce-subtle`}>{icons[type]}</span>
          {!isMobile && (
            <div className="absolute inset-0 animate-ping-slow opacity-30">
              <span className={mobileStyles.iconSize}>{icons[type]}</span>
            </div>
          )}
        </div>
        
        {/* Message - Responsive text size */}
        <div className="flex-1">
          <p className={`${mobileStyles.textSize} font-semibold tracking-wide ${textColor} ${textShadow} leading-tight`}>
            {message}
          </p>
        </div>
        
        {/* Quantum close button - Smaller on mobile */}
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
          className={`ml-1 hover:rotate-90 transition-all duration-300 hover:scale-110 ${
            isDark ? 'text-white/70 hover:text-white' : 'text-gray-700/70 hover:text-gray-900'
          }`}
        >
          <svg className={`${isMobile ? 'w-3 h-3' : 'w-5 h-5'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Energy particles - Fewer on mobile */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(mobileStyles.particleCount)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${isMobile ? 'w-0.5 h-0.5' : 'w-1.5 h-1.5'} bg-cyan-400 rounded-full animate-particle`}
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
            transform: translateY(-2px);
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
            transform: translateY(-15px) scale(1.5);
            opacity: 0.6;
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