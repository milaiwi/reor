// VaultContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { useDebounce } from 'use-debounce'
import VaultManager from './VaultManager'
import { FileInfo, FileInfoTree, FileState } from 'electron/main/filesystem/types'
import {
  generateFileNameFromFileContent,
  getInvalidCharacterInFilePath,
  getNextAvailableFileNameGivenBaseName
} from '@/lib/file'
import { SuggestionsState } from '@/components/Editor/BacklinkSuggestionsDisplay'
import useOrderedSet from '@/lib/hooks/use-ordered-set'
import welcomeNote from '@/lib/welcome-note'
import { useBlockNote, BlockNoteEditor } from '@/lib/blocknote'
import { hmBlockSchema } from '@/components/Editor/schema'
import { arePathsEqual, setGroupTypes } from '@/lib/utils'
import useSemanticCache from '@/lib/utils/editor-state'
import slashMenuItems from '@/components/Editor/slash-menu-items'
import { getSimilarFiles } from '@/lib/semanticService'
import {
  getDirname,
  joinPaths,
} from '@/lib/utils'

// Create a singleton VaultManager
export const vaultManager = new VaultManager()

// Define the context type
type VaultContextType = {
  // File tree and navigation
  fileTree: FileInfoTree
  flattenedFiles: FileInfo[]
  vaultDirectory: string
  expandedDirectories: Map<string, boolean>
  toggleDirectory: (path: string) => void
  getFilesInDirectory: (path: string) => FileInfo[]
  isFileInDirectory: (directoryPath: string, name: string) => boolean 
  
  // File selection and opening
  currentFile: string | null
  currentDirectory: string | null
  selectFile: (path: string) => void
  selectDirectory: (path: string | null) => void
  
  // File operations
  readFile: (path: string) => Promise<string>
  saveFile: (path: string, content: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  deleteFile: (path: string) => void
  createFile: (path: string, content: string) => Promise<FileInfo>
  replaceFile: (sourcePath: string, destinationPath: string) => Promise<void>
  createDirectory: (dirPath: string) => Promise<void>
  
  // Advanced file operations
  openOrCreateFile: (filePath: string, optionalContent?: string, startingPos?: number) => Promise<void>
  saveCurrentlyOpenedFile: () => Promise<void>

  // File states
  getFileState: (path: string) => FileState | undefined
  isDirty: (path: string) => boolean
  isSaving: (path: string) => boolean
  
  // Editor state
  editor: BlockNoteEditor | null
  suggestionsState: SuggestionsState | null | undefined
  setSuggestionsState: React.Dispatch<React.SetStateAction<SuggestionsState | null | undefined>>
  spellCheckEnabled: boolean
  setSpellCheckEnabled: React.Dispatch<React.SetStateAction<boolean>>

  // Navigation
  navigationHistory: string[]
  addToNavigationHistory: (value: string) => void

  // UI State
  noteToBeRenamed: string | null
  setNoteToBeRenamed: React.Dispatch<React.SetStateAction<string | null>>

  // Initialization state
  isReady: boolean
  error: Error | null
}

// Create the context with a default value
const VaultContext = createContext<VaultContextType | null>(null)

// Provider component
export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Core state handling from VaultManager
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [fileTree, setFileTree] = useState<FileInfoTree>([])
  const [flattenedFiles, setFlattenedFiles] = useState<FileInfo[]>([])
  const [vaultDirectory, setVaultDirectory] = useState<string>('')
  const [expandedDirectories, setExpandedDirectories] = useState<Map<string, boolean>>(new Map())
  const [currentDirectory, setCurrentDirectory] = useState<string | null>(null)
  const [fileStates, setFileStates] = useState<Map<string, FileState>>(new Map())
  const [savingFiles, setSavingFiles] = useState<Set<string>>(new Set())
  
  // UI and Editor State
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState | null>()
  const [spellCheckEnabled, setSpellCheckEnabled] = useState<boolean>(false)
  const [noteToBeRenamed, setNoteToBeRenamed] = useState<string | null>(null)
  const [needToWriteEditorContentToDisk, setNeedToWriteEditorContentToDisk] = useState<boolean>(false)
  const [needToIndexEditorContent, setNeedToIndexEditorContent] = useState<boolean>(false)
  const [currentlyChangingFilePath, setCurrentlyChangingFilePath] = useState(false)

  // Creating a ref to store the current saveCurrentlyOpenedFile implementation -- needed since editor may not be initialized yet.
  const saveCurrentlyOpenedFileRef = useRef<() => Promise<void>>(async () => {})

  // Navigation history
  const {
    add: addToNavigationHistory,
    remove: removeFromNavigationHistory,
    values: navigationHistory,
  } = useOrderedSet()

  // Save editor content to disk
  const saveEditorContentToDisk = async () => {
    if (editor?.currentFilePath && needToWriteEditorContentToDisk && editor) {
      const blocks = editor.topLevelBlocks
      const markdownContent = await editor.blocksToMarkdown(blocks)

      if (markdownContent !== null) {
        await vaultManager.saveFile(editor.currentFilePath, markdownContent)
        setNeedToWriteEditorContentToDisk(false)
      }
    }
  }

  const saveCurrentlyOpenedFile = async () => {
    return saveCurrentlyOpenedFileRef.current()
  }

  // Initialize the editor
  const editor = useBlockNote<typeof hmBlockSchema>({
    onEditorContentChange() {
      if (editor.currentFilePath && !isDirty(editor.currentFilePath)) {
        markDirty(editor.currentFilePath)
      }
      setNeedToWriteEditorContentToDisk(true)
      setNeedToIndexEditorContent(true)
    },
    blockSchema: hmBlockSchema,
    slashMenuItems,
    linkExtensionOptions: {
      openFile: (path: string) => {
        openOrCreateFile(path)
      },
    },
    fileOperations: {
      saveCurrentlyOpenedFile: () => saveCurrentlyOpenedFileRef.current()
    }
  })

  // Debounced editor content for auto-save
  const [debouncedEditor] = useDebounce(editor?.topLevelBlocks, 200000)

  // Initialize the VaultManager
  useEffect(() => {
    const initVault = async () => {
      try {
        await vaultManager.initialize()
        setIsReady(true)
        
        // Set up event listeners after initialization
        setupEventListeners()
        setFileTree(vaultManager.fileTreeData)
        setFlattenedFiles(vaultManager.flattenedFiles)
        setVaultDirectory(vaultManager.vaultDirectory)

        // Load spell check setting
        const storedSpellCheckEnabled = await window.electronStore.getSpellCheckMode()
        setSpellCheckEnabled(storedSpellCheckEnabled)

        // Check first-time usage
        await checkAppUsage()
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
    vaultManager.on('directoryToggled', ({ path, isExpanded }) => {
      setExpandedDirectories(prev => {
        const newMap = new Map(prev)
        newMap.set(path, isExpanded)
        return newMap
      })
    })

    vaultManager.on('treeUpdated', ({ tree, flattenedFiles }) => {
      setFileTree(tree)
      setFlattenedFiles(flattenedFiles)
    })
    
    // Listen for file selection events
    vaultManager.on('fileSelected', (path: string) => {
      editor?.setCurrentFilePath(path)
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
    
    // Listen for file delete events
    vaultManager.on('fileDeleted', ({ path }) => {
      if (editor?.currentFilePath === path) {
        editor.setCurrentFilePath(null)
        editor?.replaceBlocks(editor.topLevelBlocks, [])
      }
    })
  }, [
    editor,
    removeFromNavigationHistory,
    addToNavigationHistory
  ])
  
  // Auto-save on editor content change
  useEffect(() => {
    if (debouncedEditor && !currentlyChangingFilePath && editor?.currentFilePath) {
      saveEditorContentToDisk()

      // Check if we need to rename a new file based on content
      if (editor) {
        handleNewFileRenaming(editor.currentFilePath)
      }
    }
  }, [
    debouncedEditor,
    editor?.currentFilePath,
    currentlyChangingFilePath
  ])

  // Handle window close event to save content
  useEffect(() => {
    const handleWindowClose = async () => {
      if (editor?.currentFilePath && editor && editor.topLevelBlocks) {
        await saveEditorContentToDisk()
        await window.database.indexFileInDatabase(editor.currentFilePath)
      }
    }

    const removeWindowCloseListener = window.ipcRenderer.receive(
      'prepare-for-window-close',
      handleWindowClose
    )

    return () => {
      removeWindowCloseListener()
    }
  }, [editor])

  useEffect(() => {
    saveCurrentlyOpenedFileRef.current = async () => {
      if (editor?.currentFilePath && needToWriteEditorContentToDisk && editor) {
        const blocks = editor.topLevelBlocks
        const markdownContent = await editor.blocksToMarkdown(blocks)
  
        if (markdownContent !== null) {
          await vaultManager.saveFile(editor.currentFilePath, markdownContent)
          setNeedToWriteEditorContentToDisk(false)
        }
      }
    }
  }, [editor, vaultManager])

  // First-time app usage check
  const checkAppUsage = async () => {
    if (!editor) return

    const hasOpened = await window.electronStore.getHasUserOpenedAppBefore()
    if (!hasOpened) {
      await window.electronStore.setHasUserOpenedAppBefore()
      await openOrCreateFile('Welcome to Reor', welcomeNote)
    }
  }

  const openEmptyPage = () => {
    editor?.setCurrentFilePath(null)
  }

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
    (oldPath: string, newPath: string) => {
      vaultManager.renameFile(oldPath, newPath)
      removeFromNavigationHistory(oldPath)
      addToNavigationHistory(newPath)

      if (editor?.currentFilePath === oldPath) {
        editor.setCurrentFilePath(newPath)
      }
    },
    [isReady]
  )
  
  const deleteFile = useCallback(
    (path: string) => {
      vaultManager.deleteFile(path)
      if (editor?.currentFilePath && arePathsEqual(editor.currentFilePath, path)) {
        if (navigationHistory.length > 0) {
          const newIndex = navigationHistory.length - 1
          openOrCreateFile(navigationHistory[newIndex], undefined)
        } else {
          openEmptyPage()
        }
      }
    },
    [isReady]
  )
  
  const createFile = useCallback(
    (path: string, initialContent: string = '') => vaultManager.createFile(path, initialContent),
    [isReady]
  )

  const replaceFile = useCallback(
    (sourcePath: string, destinationPath: string) => vaultManager.replaceFile(sourcePath, destinationPath),
    [isReady]
  )

  const createDirectory = useCallback(
    (dirPath: string) => vaultManager.createDirectory(dirPath),
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

  const getFilesInDirectory = useCallback(
    (path: string) => vaultManager.getFilesInDirectory(path),
    [isReady]
  )

  const isFileInDirectory = useCallback(
    (directoryPath: string, name: string) => vaultManager.isFileInDirectory(directoryPath, name),
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
  
  const markDirty = useCallback(
    (path: string) => vaultManager.markDirty(path),
    [isReady]
  );

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


  // Advanced file operations
  // Loads the file content into the editor
  const loadFileIntoEditor = async (filePath: string, startingPos?: number) => {
    if (editor?.currentFilePath === filePath) return
    setCurrentlyChangingFilePath(true)

    // Save current file before loading new one
    if (editor?.currentFilePath) {
      await saveEditorContentToDisk()
      if (needToIndexEditorContent) {
        window.database.indexFileInDatabase(editor.currentFilePath)
        setNeedToIndexEditorContent(false)
      }
    }

    // Read the file content using VaultManager
    const fileContent = await vaultManager.readFile(filePath)
    useSemanticCache.getState().setSemanticData(filePath, await getSimilarFiles(filePath))

    // Load content into editor
    const blocks = await editor.markdownToBlocks(fileContent)
    // @ts-expect-error
    editor.replaceBlocks(editor.topLevelBlocks, blocks)
    setGroupTypes(editor?._tiptapEditor, blocks)

    if (startingPos)
      editor.scrollToParentBlock(startingPos)

    // Updating state
    console.log(`New content is: `, fileContent)
    editor.setCurrentFilePath(filePath)
    setCurrentlyChangingFilePath(false)

    // Set current directory and update editor state
    const parentDirectory = getDirname(filePath)
    setCurrentDirectory(parentDirectory)

    // Add to navigation history
    addToNavigationHistory(filePath)
  }

  const openOrCreateFile = async (
    filePath: string,
    optionalContentToWriteOnCreate?: string,
    startingPos?: number,
  ): Promise<void> => {
    let fileObject = vaultManager.getFileAtPath(filePath)
    if (!fileObject) {
      const newFileObject = await createFile(filePath, optionalContentToWriteOnCreate)
      await loadFileIntoEditor(newFileObject.path, startingPos ?? undefined)
    } else {
      await loadFileIntoEditor(fileObject.file.path, startingPos ?? undefined)
    }
  }

  const handleNewFileRenaming = async (filePath: string) => {
    if (!editor) return

    const fileState = vaultManager.getFileAtPath(filePath)
    if (
      fileState &&
      fileState.file.name.startsWith('Untitled') &&
      new Date().getTime() - fileState.file.dateCreated.getTime() < 60000
    ) {
      const editorText = await editor.blocksToMarkdown(editor.topLevelBlocks)
      if (editorText) {
        const newProposedFileName = generateFileNameFromFileContent(editorText)
        if (newProposedFileName) {
          const directoryToMakeFileIn = getDirname(filePath)
          // Get files in directory using flattenedFiles but filtered by directory
          const filesInDirectory = flattenedFiles.filter(
            file => getDirname(file.path) === directoryToMakeFileIn
          )
          const fileName = getNextAvailableFileNameGivenBaseName(
            filesInDirectory.map((file) => file.name),
            newProposedFileName,
          )
          const newFilePath = joinPaths(directoryToMakeFileIn, fileName)
          await vaultManager.renameFile(filePath, newFilePath)
        }
      }
    }
  }
  
  // Create the context value with memoization to prevent unnecessary re-renders
  const contextValue = useMemo<VaultContextType>(() => ({
    // File tree and navigation
    fileTree,
    flattenedFiles,
    vaultDirectory,
    expandedDirectories,
    toggleDirectory,
    getFilesInDirectory,
    isFileInDirectory,
    
    // File selection and opening
    currentFile: editor?.currentFilePath ?? null,
    currentDirectory,
    selectFile,
    selectDirectory,
    
    // File operations
    readFile,
    saveFile,
    renameFile,
    deleteFile,
    createFile,
    replaceFile,
    createDirectory,
    
    // Advanced file operations
    openOrCreateFile,
    saveCurrentlyOpenedFile,
    
    // File states
    getFileState,
    isDirty,
    isSaving,
    
    // Editor state
    editor,
    suggestionsState,
    setSuggestionsState,
    spellCheckEnabled,
    setSpellCheckEnabled,
    
    // Navigation
    navigationHistory,
    addToNavigationHistory,
    
    // UI state
    noteToBeRenamed,
    setNoteToBeRenamed,
    
    // Initialization state
    isReady,
    error
  }), [
    fileTree,
    flattenedFiles,
    vaultDirectory,
    expandedDirectories,
    toggleDirectory,
    getFilesInDirectory,
    isFileInDirectory,
    editor?.currentFilePath,
    currentDirectory,
    selectFile,
    selectDirectory,
    readFile,
    saveFile,
    renameFile,
    deleteFile,
    createFile,
    replaceFile,
    createDirectory,
    openOrCreateFile,
    saveCurrentlyOpenedFile,
    getFileState,
    isDirty,
    isSaving,
    editor,
    suggestionsState,
    setSuggestionsState,
    spellCheckEnabled,
    setSpellCheckEnabled,
    navigationHistory,
    addToNavigationHistory,
    noteToBeRenamed,
    setNoteToBeRenamed,
    isReady,
    error
  ])
  

  return <VaultContext.Provider value={contextValue}>{children}</VaultContext.Provider>
}

// Custom hook to use the vault context
export const useVault = () => {
  const context = useContext(VaultContext)
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider')
  }
  return context
}