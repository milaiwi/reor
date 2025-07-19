/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { createContext, useContext, ReactNode } from 'react'
import { FileInfo, FileInfoTree } from 'electron/main/filesystem/types'
import { SuggestionsState } from '@/components/Editor/BacklinkSuggestionsDisplay'
import { HighlightData } from '@/components/Editor/HighlightExtension'
import { useBlockNote, BlockNoteEditor } from '@/lib/blocknote'
import { useFileSystem } from './FileSystemProvider'
import { useEditor } from './EditorProvider'
import { useNavigation } from './NavigationProvider'
import { useUISettings } from './UISettingsProvider'

// Facade type that combines all the functionality from the focused providers
type FileContextType = {
  // File system operations
  vaultFilesTree: FileInfoTree
  vaultFilesFlattened: FileInfo[]
  expandedDirectories: Map<string, boolean>
  handleDirectoryToggle: (path: string) => void
  createFileIfNotExists: (filePath: string, optionalContent?: string) => Promise<FileInfo>
  renameFile: (oldFilePath: string, newFilePath: string) => Promise<void>
  deleteFile: (path: string | undefined) => Promise<boolean>
  
  // Editor operations
  editor: BlockNoteEditor | null
  currentlyOpenFilePath: string | null
  setCurrentlyOpenFilePath: React.Dispatch<React.SetStateAction<string | null>>
  saveCurrentlyOpenedFile: () => Promise<void>
  openOrCreateFile: (filePath: string, optionalContentToWriteOnCreate?: string, startingPos?: number) => Promise<void>
  
  // Navigation
  navigationHistory: string[]
  addToNavigationHistory: (value: string) => void
  selectedDirectory: string | null
  setSelectedDirectory: React.Dispatch<React.SetStateAction<string | null>>
  
  // UI Settings
  suggestionsState: SuggestionsState | null | undefined
  setSuggestionsState: React.Dispatch<React.SetStateAction<SuggestionsState | null | undefined>>
  spellCheckEnabled: boolean
  setSpellCheckEnabled: React.Dispatch<React.SetStateAction<boolean>>
  highlightData: HighlightData
  noteToBeRenamed: string
  setNoteToBeRenamed: React.Dispatch<React.SetStateAction<string>>
  fileDirToBeRenamed: string
  setFileDirToBeRenamed: React.Dispatch<React.SetStateAction<string>>
}

export const FileContext = createContext<FileContextType | undefined>(undefined)

export const useFileContext = () => {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider')
  }
  return context
}

// Facade provider that combines all the focused providers
export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const fileSystem = useFileSystem()
  const editor = useEditor()
  const navigation = useNavigation()
  const uiSettings = useUISettings()

  const contextValue: FileContextType = {
    // File system operations
    vaultFilesTree: fileSystem.vaultFilesTree,
    vaultFilesFlattened: fileSystem.vaultFilesFlattened,
    expandedDirectories: fileSystem.expandedDirectories,
    handleDirectoryToggle: fileSystem.handleDirectoryToggle,
    createFileIfNotExists: fileSystem.createFileIfNotExists,
    renameFile: fileSystem.renameFile,
    deleteFile: fileSystem.deleteFile,
    
    // Editor operations
    editor: editor.editor,
    currentlyOpenFilePath: editor.currentlyOpenFilePath,
    setCurrentlyOpenFilePath: editor.setCurrentlyOpenFilePath,
    saveCurrentlyOpenedFile: editor.saveCurrentlyOpenedFile,
    openOrCreateFile: editor.openOrCreateFile,
    
    // Navigation
    navigationHistory: navigation.navigationHistory,
    addToNavigationHistory: navigation.addToNavigationHistory,
    selectedDirectory: navigation.selectedDirectory,
    setSelectedDirectory: navigation.setSelectedDirectory,
    
    // UI Settings
    suggestionsState: uiSettings.suggestionsState,
    setSuggestionsState: uiSettings.setSuggestionsState,
    spellCheckEnabled: uiSettings.spellCheckEnabled,
    setSpellCheckEnabled: uiSettings.setSpellCheckEnabled,
    highlightData: uiSettings.highlightData,
    noteToBeRenamed: navigation.noteToBeRenamed,
    setNoteToBeRenamed: navigation.setNoteToBeRenamed,
    fileDirToBeRenamed: navigation.fileDirToBeRenamed,
    setFileDirToBeRenamed: navigation.setFileDirToBeRenamed,
  }

  return <FileContext.Provider value={contextValue}>{children}</FileContext.Provider>
}
