import React from 'react'

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large'
  className?: string
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8',
  }

  return (
    <div
      className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`}
    />
  )
}

export default Spinner
