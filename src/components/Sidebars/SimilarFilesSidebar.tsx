import React, { useEffect, useState } from 'react'
import { DBQueryResult } from 'electron/main/vector-database/schema'
import { useFileContext } from '@/contexts/FileContext'
import { useContentContext } from '@/contexts/ContentContext'
import { hybridSearch } from '@/lib/db'
import DBResultPreview from '@/components/File/DBResultPreview'

const SimilarFilesSidebarComponent: React.FC = () => {
  const { currentlyOpenFilePath, saveCurrentlyOpenedFile } = useFileContext()
  const { openContent } = useContentContext()
  const [similarFiles, setSimilarFiles] = useState<DBQueryResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const updateSimilarFiles = async () => {
    if (!currentlyOpenFilePath) {
      setSimilarFiles([])
      return
    }

    setIsLoading(true)
    try {
      await saveCurrentlyOpenedFile()
      const results = await hybridSearch(currentlyOpenFilePath, 10, undefined, 0.7)
      setSimilarFiles(results)
    } catch (error) {
      console.error('Error fetching similar files:', error)
      setSimilarFiles([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    updateSimilarFiles()
  }, [currentlyOpenFilePath])

  const handleFileSelect = (path: string) => {
    openContent(path)
  }

  if (!currentlyOpenFilePath) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-gray-500">No file selected</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 p-4 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Similar Files</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : similarFiles.length > 0 ? (
          <div className="space-y-2">
            {similarFiles.map((file, index) => (
              <DBResultPreview key={index} dbResult={file} onSelect={handleFileSelect} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <p className="text-gray-500">No similar files found</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SimilarFilesSidebarComponent
