import React from 'react'

const Card = ({ children, className = '', padding = true, hover = false }) => {
  return (
    <div 
      className={`
        bg-white dark:bg-gray-800 rounded-xl shadow-md 
        ${padding ? 'p-4 md:p-6' : ''}
        ${hover ? 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1' : ''}
        border border-gray-100 dark:border-gray-700
        ${className}
      `}
    >
      {children}
    </div>
  )
}

const CardHeader = ({ children, className = '' }) => (
  <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${className}`}>
    {children}
  </div>
)

const CardBody = ({ children, className = '' }) => (
  <div className={`${className}`}>
    {children}
  </div>
)

const CardFooter = ({ children, className = '' }) => (
  <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 ${className}`}>
    {children}
  </div>
)

Card.Header = CardHeader
Card.Body = CardBody
Card.Footer = CardFooter

export default Card
