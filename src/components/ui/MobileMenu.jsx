import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export default function MobileMenu({ isOpen, onClose, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])
  
  if (!isOpen) return null
  
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
        <div className="p-4">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
          <div className="mt-8">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
