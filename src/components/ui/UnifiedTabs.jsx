// src/components/ui/UnifiedTabs.jsx
import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../context/ThemeContext'

export default function UnifiedTabs({ tabs, defaultTab, onChange, children }) {
  const { isMobile } = useTheme()
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)
  const contentRef = useRef(null)

  useEffect(() => {
    if (onChange) onChange(activeTab)
    setTimeout(() => {
      if (contentRef.current) {
        contentRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }
    }, 100)
  }, [activeTab, onChange])

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
  }

  // Find active content
  let activeContent = null
  if (children) {
    const childrenArray = Array.isArray(children) ? children : [children]
    activeContent = childrenArray.find(child => child?.props?.id === activeTab)
  }

  return (
    <div className="w-full">
      {/* Modern Underline Tabs */}
      <div className={`
        ${isMobile ? 'fixed bottom-0 left-0 right-0 z-20' : 'sticky top-0 z-10'}
        bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700
      `}>
        <div className="flex">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex-1 py-3 text-sm font-medium transition-all duration-200 relative
                  ${isActive 
                    ? 'text-blue-600 dark:text-blue-400' 
                    : 'text-gray-500 dark:text-gray-400'
                  }
                `}
              >
                <span className="relative inline-block px-2">
                  {tab.label.split(' ')[0]}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div ref={contentRef} className={`${isMobile ? 'pb-20' : 'pb-6'}`}>
        <div className="animate-fade-in">
          {activeContent}
        </div>
      </div>
    </div>
  )
}