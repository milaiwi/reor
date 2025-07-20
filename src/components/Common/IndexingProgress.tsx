import React from 'react'

interface IndexingProgressProps {
  indexingProgress: number
}

const IndexingProgress: React.FC<IndexingProgressProps> = ({ indexingProgress }) => {
  const percentage = Math.round(indexingProgress * 100)

  return (
    <div className="flex size-full items-center justify-center">
      <div className="mx-3 mb-3 mt-2 h-[100px] w-[500px]">
        <h2 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">Indexing Files</h2>
        <div className="mb-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="text-gray-600 dark:text-gray-400">{percentage}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <div
              className="h-full bg-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Please wait while we index your files for search and AI features...
        </p>
      </div>
    </div>
  )
}

export default IndexingProgress
