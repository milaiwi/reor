import React, { useEffect, useState } from 'react'

import { DBQueryResult } from 'electron/main/vector-database/schema'
import { toast } from 'react-toastify'
import removeMd from 'remove-markdown'

import '../../styles/global.css'

import posthog from 'posthog-js'
import errorToStringRendererProcess from '@/utils/error'
import SimilarEntriesComponent from './SemanticSidebar/SimilarEntriesComponent'
import HighlightButton from './SemanticSidebar/HighlightButton'
import { useFileContext } from '@/contexts/FileContext'
import { useWindowContentContext } from '@/contexts/WindowContentContext'

interface SimilarFilesSidebarProps {
  query_type: string
};

const SimilarFilesSidebarComponent: React.FC<SimilarFilesSidebarProps> = ({ query_type }) => {
  const [similarEntries, setSimilarEntries] = useState<DBQueryResult[]>([])
  const [isLoadingSimilarEntries, setIsLoadingSimilarEntries] = useState(false)
  console.log(`SimilarFilesSidebarComponent received query_type ${query_type}`)
  const { currentlyOpenFilePath, highlightData } = useFileContext()
  const { openContent: openTabContent } = useWindowContentContext()

  const getChunkForInitialSearchFromFile = async (filePathForChunk: string | null) => {
    // TODO: proper semantic chunking - current quick win is just to take top 500 characters
    if (!filePathForChunk) {
      return undefined
    }
    const fileContent: string = await window.fileSystem.readFile(filePathForChunk)
    if (!fileContent) {
      return undefined
    }
    const sanitizedText = removeMd(fileContent.slice(0, 500))
    return sanitizedText
  }
  const performSearchOnChunk = async (
    sanitizedText: string,
    fileToBeExcluded: string | null,
  ): Promise<DBQueryResult[]> => {
    try {
      const databaseFields = await window.database.getDatabaseFields()
      const filterString = `${databaseFields.NOTE_PATH} != '${fileToBeExcluded}'`

      setIsLoadingSimilarEntries(true)
      console.log(`Refetching queries for type: ${query_type}`)
      const searchResults: DBQueryResult[] = await window.database.search(sanitizedText, 20, filterString, query_type)

      setIsLoadingSimilarEntries(false)
      return searchResults
    } catch (error) {
      toast.error(errorToStringRendererProcess(error), {
        className: 'mt-5',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      })
      return []
    }
  }

  useEffect(() => {
    const handleNewFileOpen = async (path: string) => {
      const sanitizedText = await getChunkForInitialSearchFromFile(path)
      if (!sanitizedText) {
        return
      }
      const searchResults = await performSearchOnChunk(sanitizedText, path)

      if (searchResults.length > 0) {
        setSimilarEntries(searchResults)
      } else {
        setSimilarEntries([])
      }
    }
    if (currentlyOpenFilePath) {
      handleNewFileOpen(currentlyOpenFilePath)
    }
  }, [currentlyOpenFilePath, query_type])

  const updateSimilarEntries = async () => {
    const sanitizedText = await getChunkForInitialSearchFromFile(currentlyOpenFilePath)

    if (!sanitizedText) {
      toast.error(`Error: Could not get chunk for search ${currentlyOpenFilePath}`)
      return
    }

    const searchResults = await performSearchOnChunk(sanitizedText, currentlyOpenFilePath)
    setSimilarEntries(searchResults)
  }

  return (
    <>
      <HighlightButton
        highlightData={highlightData}
        onClick={async () => {
          setSimilarEntries([])
          const databaseFields = await window.database.getDatabaseFields()
          const filterString = `${databaseFields.NOTE_PATH} != '${currentlyOpenFilePath}'`
          const searchResults: DBQueryResult[] = await window.database.search(highlightData.text, 20, filterString)
          setSimilarEntries(searchResults)
        }}
      />{' '}
      <SimilarEntriesComponent
        similarEntries={similarEntries}
        setSimilarEntries={setSimilarEntries}
        onSelect={(path) => {
          openTabContent(path)
          posthog.capture('open_file_from_related_notes')
        }}
        updateSimilarEntries={updateSimilarEntries}
        isLoadingSimilarEntries={isLoadingSimilarEntries}
        titleText="Related notes"
      />
    </>
  )
}

export default SimilarFilesSidebarComponent
