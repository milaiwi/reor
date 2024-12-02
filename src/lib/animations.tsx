import React from 'react'

const LoadingDots = () => {
  return (
    <div className="flex space-x-1 text-lg text-main-contrast">
      <span className="animate-bounce">.</span>
      <span className="animate-bounce delay-200">.</span>
      <span className="delay-[400ms] animate-bounce">.</span>
    </div>
  )
}

export default LoadingDots
