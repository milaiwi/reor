import React from 'react'

import { DBQueryResult } from 'electron/main/vector-database/schema'
import { RefreshCw } from 'lucide-react'
import { PiGraph } from 'react-icons/pi'
import '../../../styles/global.css'
// import ResizableComponent from '@/components/Common/ResizableComponent'
import { DBResultPreview } from '@/components/File/DBResultPreview'
import { useFileContext } from '@/contexts/FileContext'
import Spinner from '@/components/ui/Spinner'

interface SimilarEntriesComponentProps {
  similarEntries: DBQueryResult[]
  setSimilarEntries?: (entries: DBQueryResult[]) => void
  onSelect: (path: string, startingPos?: number) => void
  updateSimilarEntries?: (isRefined?: boolean) => Promise<void>
  titleText: string
  isLoadingSimilarEntries: boolean
}

const SimilarEntriesComponent: React.FC<SimilarEntriesComponentProps> = ({
  similarEntries,
  setSimilarEntries,
  onSelect,
  updateSimilarEntries,
  titleText,
  isLoadingSimilarEntries,
}) => {
  let content
  const { saveCurrentlyOpenedFile } = useFileContext()

  if (similarEntries.length > 0) {
    content = (
      <div className="flex-1 w-full">
        {similarEntries
          .filter((dbResult) => dbResult)
          .map((dbResult) => (
            <div
              key={`${dbResult.notepath}-${dbResult.subnoteindex}`}
              className="px-2 py-1 w-full"
            >
              <DBResultPreview dbResult={dbResult} onSelect={onSelect} />
            </div>
          ))}
      </div>
    )
  } else if (!isLoadingSimilarEntries) {
    content = (
      <div className="h-full w-full">
        <p className="text-sm font-body m-0 leading-relaxed text-gray-600 text-center">
          No items found
        </p>
      </div>
    )
  }

  return (
    <div className="max-h-full overflow-y-auto bg-gray-800">
      <div className="flex-1">
        <div>
          {/* Header */}
          <div className="flex items-center px-4 py-2 bg-neutral-800">
            <div className="flex-1" />
            <div className="flex items-center justify-center">
              <PiGraph size={16} className="text-gray-300" />
              <p className="ml-1 text-sm text-gray-300">
                {titleText}
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              {updateSimilarEntries && setSimilarEntries && (
                <button
                  onClick={async () => {
                    setSimilarEntries([]) // simulate refresh
                    await saveCurrentlyOpenedFile()
                    updateSimilarEntries()
                  }}
                  className="bg-transparent border-0 p-0"
                >
                  {isLoadingSimilarEntries ? <Spinner size="small" /> : <RefreshCw size={16} />}
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div>{content}</div>
        </div>
      </div>
    </div>
  )
}

export default SimilarEntriesComponent
