import React, { useState } from 'react'

const Tabs = ({ tabs, defaultTab, onChange, children }) => {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id)

  const handleTabClick = (tabId) => {
    setActiveTab(tabId)
    if (onChange) onChange(tabId)
  }

  const renderActiveTab = () => {
    if (Array.isArray(children)) {
      return children.find(child => child.props.id === activeTab)
    }
    return children
  }

  return (
    <div>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex -mb-px space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="mt-4">
        {renderActiveTab()}
      </div>
    </div>
  )
}

export default Tabs
