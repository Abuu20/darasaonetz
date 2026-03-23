import React from 'react'

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-gray-700 dark:text-gray-300 mb-2 font-medium">
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-2 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          bg-white dark:bg-gray-800
          text-gray-900 dark:text-gray-100
          border border-gray-300 dark:border-gray-600
          placeholder-gray-400 dark:placeholder-gray-500
          ${error ? 'border-red-500 dark:border-red-500' : ''}
          ${disabled ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-500 dark:text-red-400">{error}</p>}
    </div>
  )
}

export default Input
