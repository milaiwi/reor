import React from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import { removeFileExtension } from '@/lib/file'

interface DBResultPreviewProps {
  dbResult: DBQueryResult
  onSelect: (path: string, startingPos?: number) => void
}

const DBResultPreview: React.FC<DBResultPreviewProps> = ({ dbResult, onSelect }) => {
  const handleClick = () => {
    onSelect(dbResult.notepath, dbResult.blockStartingPos)
  }

  return (
    <div
      className="cursor-pointer rounded-md border border-gray-200 bg-white p-3 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
      onClick={handleClick}
    >
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {removeFileExtension(dbResult.notepath.split('/').pop() || '')}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {dbResult.notepath}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
          {dbResult.content}
        </p>
      </div>
    </div>
  )
}

export default DBResultPreview
