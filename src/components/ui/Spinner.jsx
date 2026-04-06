import React, { useState, useEffect } from 'react'

const Spinner = ({ size = 'md', color = 'blue', className = '' }) => {
  const [scale, setScale] = useState(0.3)
  const [growing, setGrowing] = useState(true)
  
  useEffect(() => {
    const interval = setInterval(() => {
      setScale(prev => {
        if (growing && prev >= 1.2) {
          setGrowing(false)
          return prev - 0.02
        }
        if (!growing && prev <= 0.3) {
          setGrowing(true)
          return prev + 0.02
        }
        return growing ? prev + 0.02 : prev - 0.02
      })
    }, 30)
    
    return () => clearInterval(interval)
  }, [growing])

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const baseSize = sizes[size] || sizes.md
  const sizeValue = parseInt(baseSize.match(/\d+/)[0])
  const currentSize = sizeValue * scale

  const colors = {
    blue: 'from-blue-500 via-cyan-400 to-blue-600',
    purple: 'from-purple-500 via-pink-400 to-purple-600',
    green: 'from-green-500 via-emerald-400 to-green-600',
    orange: 'from-orange-500 via-amber-400 to-orange-600',
    red: 'from-red-500 via-rose-400 to-red-600',
    white: 'from-white via-gray-200 to-white'
  }

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className="relative transition-all duration-100 ease-out"
        style={{ 
          width: `${currentSize}px`, 
          height: `${currentSize}px`,
          transform: `scale(${scale})`
        }}
      >
        {/* Time Portal Ring 1 - Outer */}
        <div 
          className="absolute inset-[-60px] rounded-full border-4 border-cyan-500/30"
          style={{ 
            animation: 'spinPortal 8s linear infinite',
            transform: `scale(${1/scale})`,
            transformOrigin: 'center'
          }}
        />
        
        {/* Time Portal Ring 2 - Middle */}
        <div 
          className="absolute inset-[-35px] rounded-full border-4 border-purple-500/30"
          style={{ 
            animation: 'spinPortalReverse 6s linear infinite',
            transform: `scale(${1/scale})`,
            transformOrigin: 'center'
          }}
        />
        
        {/* Time Portal Ring 3 - Inner */}
        <div 
          className="absolute inset-[-15px] rounded-full border-4 border-pink-500/30"
          style={{ 
            animation: 'spinPortal 4s linear infinite',
            transform: `scale(${1/scale})`,
            transformOrigin: 'center'
          }}
        />
        
        {/* Outer ring with gradient */}
        <div 
          className="absolute inset-0 rounded-full bg-gradient-to-r"
          style={{ 
            background: `linear-gradient(to right, ${colors[color]})`,
            animation: 'spin 2s linear infinite',
            boxShadow: '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.3)'
          }}
        />
        
        {/* Middle morphing layer */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{ 
            background: `linear-gradient(to right, ${colors[color]})`,
            animation: 'morph 2s ease-in-out infinite',
            opacity: 0.7
          }}
        />
        
        {/* Inner pulsing core - Portal Center */}
        <div 
          className="absolute inset-[30%] rounded-full"
          style={{ 
            background: `linear-gradient(to right, ${colors[color]})`,
            animation: 'pulse 1s ease-in-out infinite',
            filter: 'blur(3px)',
            boxShadow: '0 0 30px currentColor'
          }}
        />
        
        {/* Portal energy particles that also scale */}
        <div className="absolute inset-[-80px]">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: `rotate(${i * 30}deg) translateX(${70 / scale}px)`,
                animation: `portal-particle 2s linear infinite ${i * 0.2}s`,
                opacity: 0
              }}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spinPortal {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes spinPortalReverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        
        @keyframes morph {
          0%, 100% { 
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% { 
            border-radius: 30% 60% 70% 40% / 50% 60% 40% 50%;
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            transform: scale(0.7);
            opacity: 0.4;
          }
          50% { 
            transform: scale(1.3);
            opacity: 1;
          }
        }
        
        @keyframes portal-particle {
          0% {
            transform: rotate(0deg) translateX(70px) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(360deg) translateX(70px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export default Spinner