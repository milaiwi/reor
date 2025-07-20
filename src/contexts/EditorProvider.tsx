import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { useBlockNote, BlockNoteEditor } from '@/lib/blocknote'
import { hmBlockSchema } from '@/components/Editor/schema'
import { setGroupTypes } from '@/lib/utils'
import useSemanticCache from '@/lib/utils/editor-state'
import slashMenuItems from '../components/Editor/slash-menu-items'
import { getSimilarFiles } from '@/lib/semanticService'
import { useFileSystem } from './FileSystemProvider'
import welcomeNote from '@/lib/welcome-note'

type EditorContextType = {
  // Editor instance
  editor: BlockNoteEditor | null
  
  // Editor state
  currentlyOpenFilePath: string | null
  setCurrentlyOpenFilePath: React.Dispatch<React.SetStateAction<string | null>>
  currentlyChangingFilePath: boolean
  
  // Auto-save state
  needToWriteEditorContentToDisk: boolean
  needToIndexEditorContent: boolean
  
  // Editor operations
  loadFileIntoEditor: (filePath: string, startingPos?: number) => Promise<void>
  saveCurrentlyOpenedFile: () => Promise<void>
  openOrCreateFile: (filePath: string, optionalContentToWriteOnCreate?: string, startingPos?: number) => Promise<void>
  
  // Auto-save and indexing
  writeEditorContentToDisk: (filePath: string | null) => Promise<void>
  triggerIndexing: () => void
}

const EditorContext = createContext<EditorContextType | undefined>(undefined)

export const useEditor = () => {
  const context = useContext(EditorContext)
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return context
}

export const EditorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentlyOpenFilePath, setCurrentlyOpenFilePath] = useState<string | null>(null)
  const [currentlyChangingFilePath, setCurrentlyChangingFilePath] = useState(false)
  const [needToWriteEditorContentToDisk, setNeedToWriteEditorContentToDisk] = useState<boolean>(false)
  const [needToIndexEditorContent, setNeedToIndexEditorContent] = useState<boolean>(false)
  
  const {
    createFileIfNotExists,
    readFileContent,
    writeFileAndCacheContent,
    prefetchFile,
    handleNewFileRenaming,
  } = useFileSystem()

  // Editor instance
  const editor = useBlockNote<typeof hmBlockSchema>({
    onEditorContentChange() {
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
  })

  const [debouncedEditor] = useDebounce(editor?.topLevelBlocks, 3000)

  // Auto-save logic
  const writeEditorContentToDisk = async (filePath: string | null) => {
    if (filePath !== null && needToWriteEditorContentToDisk && editor) {
      const blocks = editor.topLevelBlocks
      const markdownContent = await editor.blocksToMarkdown(blocks)
      if (markdownContent !== null) {
        await writeFileAndCacheContent(filePath, markdownContent)
        setNeedToWriteEditorContentToDisk(false)
      }
    }
  }

  const triggerIndexing = () => {
    if (currentlyOpenFilePath && needToIndexEditorContent) {
      window.database.indexFileInDatabase(currentlyOpenFilePath)
      setNeedToIndexEditorContent(false)
    }
  }

  // Load file into editor
  const loadFileIntoEditor = async (filePath: string, startingPos?: number) => {
    setCurrentlyChangingFilePath(true)
    
    // Save current file before switching
    await writeEditorContentToDisk(currentlyOpenFilePath)
    triggerIndexing()
    
    // Load new file content
    const fileContent = await readFileContent(filePath)
    useSemanticCache.getState().setSemanticData(filePath, await getSimilarFiles(filePath))
    
    const blocks = await editor.markdownToBlocks(fileContent ?? '')
    // @ts-expect-error
    editor.replaceBlocks(editor.topLevelBlocks, blocks)
    setGroupTypes(editor?._tiptapEditor, blocks)

    if (startingPos) {
      editor.scrollToParentBlock(startingPos)
    }

    setCurrentlyOpenFilePath(filePath)
    setCurrentlyChangingFilePath(false)
    editor.setCurrentFilePath(filePath)
  }

  // Open or create file
  const openOrCreateFile = async (
    filePath: string,
    optionalContentToWriteOnCreate?: string,
    startingPos?: number,
  ): Promise<void> => {
    const fileObject = await createFileIfNotExists(filePath, optionalContentToWriteOnCreate)
    await loadFileIntoEditor(fileObject.path, startingPos ?? undefined)
  }

  // Save current file
  const saveCurrentlyOpenedFile = async () => {
    await writeEditorContentToDisk(currentlyOpenFilePath)
  }

  // Auto-save on content change
  useEffect(() => {
    const handleAutoSave = async () => {
      if (debouncedEditor && !currentlyChangingFilePath) {
        writeEditorContentToDisk(currentlyOpenFilePath)
        if (editor && currentlyOpenFilePath) {
          // Handle auto-rename for new files
          const markdownContent = await editor.blocksToMarkdown(debouncedEditor)
          if (markdownContent) {
            const newFilePath = await handleNewFileRenaming(currentlyOpenFilePath, markdownContent)
            if (newFilePath) {
              setCurrentlyOpenFilePath(newFilePath)
            }
          }
        }
      }
    }
    
    handleAutoSave()
  }, [debouncedEditor, currentlyOpenFilePath, editor, currentlyChangingFilePath, writeEditorContentToDisk, handleNewFileRenaming, setCurrentlyOpenFilePath])

  // Welcome note for first-time users
  useEffect(() => {
    async function checkAppUsage() {
      if (!editor || currentlyOpenFilePath) return
      const hasOpened = await window.electronStore.getHasUserOpenedAppBefore()

      if (!hasOpened) {
        await window.electronStore.setHasUserOpenedAppBefore()
        openOrCreateFile('Welcome to Reor', welcomeNote)
      }
    }

    checkAppUsage()
  }, [editor, currentlyOpenFilePath, openOrCreateFile])

  // Save on window close
  useEffect(() => {
    const handleWindowClose = async () => {
      if (currentlyOpenFilePath !== null && editor && editor.topLevelBlocks !== null) {
        const blocks = editor.topLevelBlocks
        const markdownContent = await editor.blocksToMarkdown(blocks)
        await writeFileAndCacheContent(currentlyOpenFilePath, markdownContent ?? '')
        await window.database.indexFileInDatabase(currentlyOpenFilePath)
      }
    }

    const removeWindowCloseListener = window.ipcRenderer.receive('prepare-for-window-close', handleWindowClose)

    return () => {
      removeWindowCloseListener()
    }
  }, [currentlyOpenFilePath, editor, writeFileAndCacheContent])

  const contextValue: EditorContextType = {
    editor,
    currentlyOpenFilePath,
    setCurrentlyOpenFilePath,
    currentlyChangingFilePath,
    needToWriteEditorContentToDisk,
    needToIndexEditorContent,
    loadFileIntoEditor,
    saveCurrentlyOpenedFile,
    openOrCreateFile,
    writeEditorContentToDisk,
    triggerIndexing,
  }

  return (
    <EditorContext.Provider value={contextValue}>
      {children}
    </EditorContext.Provider>
  )
} 