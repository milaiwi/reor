import React, { createContext, useContext, useMemo, ReactNode, useState, useCallback } from 'react'
import posthog from 'posthog-js'
import { useChatContext } from './ChatContext'
import { useVault } from '@/components/File/VaultManager/VaultContext'
import { getNextAvailableFileNameGivenBaseName } from '@/lib/file'
import { getDirname, joinPaths } from '@/lib/utils'

interface ContentContextType {
  showEditor: boolean
  setShowEditor: (showEditor: boolean) => void
  openContent: (
    pathOrChatID: string,
    optionalContentToWriteOnCreate?: string,
    dontUpdateChatHistory?: boolean,
    startingPos?: number,
  ) => void
  currentOpenFileOrChatID: string | null
  createUntitledNote: (parentFileOrDirectory?: string) => void
}

const ContentContext = createContext<ContentContextType | undefined>(undefined)

export const useContentContext = (): ContentContextType => {
  const context = useContext(ContentContext)
  if (context === undefined) {
    throw new Error('useContentContext must be used within a ContentProvider')
  }
  return context
}

interface ContentProviderProps {
  children: ReactNode
}

export const ContentProvider: React.FC<ContentProviderProps> = ({ children }) => {
  const [showEditor, setShowEditor] = useState(false)
  const [currentOpenFileOrChatID, setCurrentOpenFileOrChatID] = useState<string | null>(null)

  // Use ChatContext for chat-related operations
  const { allChatsMetadata, openNewChat } = useChatContext()

  const {
    flattenedFiles,
    openOrCreateFile,
    addToNavigationHistory,
    currentDirectory,
    getFilesInDirectory,
    vaultDirectory
  } = useVault()

  const openContent = React.useCallback(
    async (
      pathOrChatID: string,
      optionalContentToWriteOnCreate?: string,
      dontUpdateChatHistory?: boolean,
      startingPos?: number,
    ) => {
      if (!pathOrChatID) return

      // Check if this is a chat or a file 
      const chatMetadata = allChatsMetadata.find((chat) => chat.id === pathOrChatID)

      if (chatMetadata) {
        // It's a chat, open it
        openNewChat(pathOrChatID)
      } else {
        // It's a file, open it in the editor
        setShowEditor(true)
        openOrCreateFile(pathOrChatID, optionalContentToWriteOnCreate, startingPos)
      }

      // Update state and history
      setCurrentOpenFileOrChatID(pathOrChatID)

      if (!dontUpdateChatHistory) {
        addToNavigationHistory(pathOrChatID)
      }
    },
    [allChatsMetadata, openNewChat, openOrCreateFile, addToNavigationHistory],
  )

  // Create a new untitled note
  const createUntitledNote = useCallback(
    async (parentDirectory?: string) => {
      // Determine the directory to create the file in
      const directoryToMakeFileIn =
        parentDirectory || 
        currentDirectory || 
        vaultDirectory

      // Get files in the selected directory
      const filesInDirectory = parentDirectory ?
        getFilesInDirectory(directoryToMakeFileIn) :
        flattenedFiles.filter(file => getDirname(file.path) === directoryToMakeFileIn)
      
        // Generate a unique name for the new file
      const fileName = getNextAvailableFileNameGivenBaseName(
        filesInDirectory.map((file) => file.name),
        'Untitled',
      )

      // Create the full path and open the content
      const finalPath = joinPaths(directoryToMakeFileIn, fileName)
      openContent(finalPath, `## `)
      
      // Analytics
      posthog.capture('created_new_note_from_new_note_modal')
    },
    [currentDirectory, flattenedFiles, openContent, getFilesInDirectory],
  )

  const ContentContextMemo = useMemo(
    () => ({
      showEditor,
      setShowEditor,
      openContent,
      currentOpenFileOrChatID,
      createUntitledNote,
    }),
    [showEditor, openContent, currentOpenFileOrChatID, createUntitledNote],
  )

  return <ContentContext.Provider value={ContentContextMemo}>{children}</ContentContext.Provider>
}
