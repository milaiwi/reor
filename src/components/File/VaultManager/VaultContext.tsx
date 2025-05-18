// VaultContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import VaultManager from './VaultManager'
import { FileInfo, FileInfoTree, FileState } from 'electron/main/filesystem/types'

// Create a singleton VaultManager
export const vaultManager = new VaultManager()

// Define the context type
type VaultContextType = {
  // File tree and navigation
  fileTree: FileInfo[] | null
  expandedDirectories: Map<string, boolean>
  toggleDirectory: (path: string) => void
  
  // File selection and opening
  currentFile: string | null
  currentDirectory: string | null
  selectFile: (path: string) => void
  selectDirectory: (path: string | null) => void
  
  // File operations
  readFile: (path: string) => Promise<string>
  saveFile: (path: string, content: string) => Promise<void>
  renameFile: (oldPath: string, newPath: string) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  createFile: (path: string, content: string) => Promise<void>
  
  // File states
  getFileState: (path: string) => FileState | undefined
  isDirty: (path: string) => boolean
  isSaving: (path: string) => boolean
  
  // Initialization state
  isReady: boolean
  error: Error | null
}

// Create the context with a default value
const VaultContext = createContext<VaultContextType | null>(null)

// Provider component
export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [fileTree, setFileTree] = useState<FileInfoTree | null>(null)
  const [expandedDirectories, setExpandedDirectories] = useState<Map<string, boolean>>(new Map())
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null)
  const [fileStates, setFileStates] = useState<Map<string, FileState>>(new Map())
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set())
  
  // Initialize the VaultManager
  useEffect(() => {
    const initVault = async () => {
      try {
        await vaultManager.initialize()
        setIsReady(true)
        
        // Set up event listeners after initialization
        setupEventListeners()
        setFileTree(vaultManager.fileTreeData)
      } catch (err) {
        setError(err as Error)
      }
    }
    
    initVault()
    return () => {
      // Clean up event listeners
    }
  }, [])
  
  // Set up event listeners for VaultManager events
  const setupEventListeners = useCallback(() => {
    // Listen for directory toggle events
    // vaultManager.on('directoryToggled', ({ path, isExpanded }) => {
    //   setExpandedDirectories(prev => {
    //     const newMap = new Map(prev)
    //     newMap.set(path, isExpanded)
    //     return newMap
    //   })
    // })
    
    // Listen for file selection events
    vaultManager.on('fileSelected', (path: string) => {
      setCurrentFile(path)
    })
    
    // Listen for directory selection events
    vaultManager.on('directorySelected', (path: string | null) => {
      setCurrentDirectory(path)
    })
    
    // Listen for file state changes
    vaultManager.on('fileStateChanged', ({ path, state }) => {
      setFileStates(prev => {
        const newMap = new Map(prev)
        newMap.set(path, state)
        return newMap
      })
      
      // Track saving state
      if (state.status === 'saving') {
        setSavingFiles(prev => new Set(prev).add(path))
      } else {
        setSavingFiles(prev => {
          const newSet = new Set(prev)
          newSet.delete(path)
          return newSet
        })
      }
    })
    
    // // Listen for tree updates
    // vaultManager.on('treeUpdated', ({ files }) => {
    //   console.log(`Treeupdated files are: `, files)
    //   setFileTree(files)
    // })
  }, [])
  
  // File operation wrappers
  const readFile = useCallback(
    (path: string) => vaultManager.readFile(path),
    [isReady]
  )
  
  const saveFile = useCallback(
    (path: string, content: string) => vaultManager.saveFile(path, content),
    [isReady]
  )
  
  const renameFile = useCallback(
    (oldPath: string, newPath: string) => vaultManager.renameFile(oldPath, newPath),
    [isReady]
  )
  
  const deleteFile = useCallback(
    (path: string) => vaultManager.deleteFile(path),
    [isReady]
  )
  
  const createFile = useCallback(
    (path: string, initialContent: string = '') => vaultManager.createFile(path, initialContent),
    [isReady]
  )
  
  // Directory and file selection
  const toggleDirectory = useCallback(
    (path: string) => {
      if (isReady) {
        vaultManager.toggleDirectory(path)
      }
    },
    [isReady]
  )
  
  const selectFile = useCallback(
    (path: string) => {
      if (isReady) {
        vaultManager.selectFile(path)
      }
    },
    [isReady]
  )
  
  const selectDirectory = useCallback(
    (path: string | null) => {
      if (isReady) {
        vaultManager.selectDirectory(path)
      }
    },
    [isReady]
  )
  
  // File state helpers
  const getFileState = useCallback(
    (path: string) => fileStates.get(path),
    [fileStates]
  )
  
  const isDirty = useCallback(
    (path: string) => {
      const state = fileStates.get(path)
      return state?.status === 'dirty'
    },
    [fileStates]
  )
  
  const isSaving = useCallback(
    (path: string) => savingFiles.has(path),
    [savingFiles]
  )
  
  // Create the context value
  const contextValue: VaultContextType = {
    fileTree,
    expandedDirectories,
    toggleDirectory,
    currentFile,
    currentDirectory,
    selectFile,
    selectDirectory,
    readFile,
    saveFile,
    renameFile,
    deleteFile,
    createFile,
    getFileState,
    isDirty,
    isSaving,
    isReady,
    error
  }
  
  return (
    <VaultContext.Provider value={contextValue}>
      {children}
    </VaultContext.Provider>
  )
}

// Custom hook to use the vault context
export const useVault = () => {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}