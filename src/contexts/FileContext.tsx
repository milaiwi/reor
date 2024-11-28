/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { useDebounce } from 'use-debounce'
import { FileInfo, FileInfoTree } from 'electron/main/filesystem/types'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteEditor } from '@blocknote/core'
import {
  findRelevantDirectoriesToBeExpanded,
  flattenFileInfoTree,
  generateFileNameFromFileContent,
  getFilesInDirectory,
  getInvalidCharacterInFilePath,
  getNextAvailableFileNameGivenBaseName,
  sortFilesAndDirectories,
} from '@/lib/file'
import { SuggestionsState } from '@/components/Editor/BacklinkSuggestionsDisplay'
import { HighlightData } from '@/components/Editor/HighlightExtension'
import '@/styles/tiptap.scss'
import getMarkdown from '@/components/Editor/utils'
import useOrderedSet from '../lib/hooks/use-ordered-set'
import welcomeNote from '@/lib/welcome-note'

type FileContextType = {
  vaultFilesTree: FileInfoTree
  vaultFilesFlattened: FileInfo[]
  expandedDirectories: Map<string, boolean>
  handleDirectoryToggle: (path: string) => void
  currentlyOpenFilePath: string | null
  setCurrentlyOpenFilePath: React.Dispatch<React.SetStateAction<string | null>>
  saveCurrentlyOpenedFile: () => Promise<void>
  editor: BlockNoteEditor | null
  navigationHistory: string[]
  addToNavigationHistory: (value: string) => void
  openOrCreateFile: (filePath: string, optionalContentToWriteOnCreate?: string) => Promise<void>
  suggestionsState: SuggestionsState | null | undefined
  spellCheckEnabled: boolean
  highlightData: HighlightData
  noteToBeRenamed: string
  setNoteToBeRenamed: React.Dispatch<React.SetStateAction<string>>
  fileDirToBeRenamed: string
  setFileDirToBeRenamed: React.Dispatch<React.SetStateAction<string>>
  renameFile: (oldFilePath: string, newFilePath: string) => Promise<void>
  setSuggestionsState: React.Dispatch<React.SetStateAction<SuggestionsState | null | undefined>>
  setSpellCheckEnabled: React.Dispatch<React.SetStateAction<boolean>>
  deleteFile: (path: string | undefined) => Promise<boolean>
  selectedDirectory: string | null
  setSelectedDirectory: React.Dispatch<React.SetStateAction<string | null>>
}

export const FileContext = createContext<FileContextType | undefined>(undefined)

export const useFileContext = () => {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider')
  }
  return context
}

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vaultFilesTree, setVaultFilesTree] = useState<FileInfoTree>([])
  const [vaultFilesFlattened, setVaultFilesFlattened] = useState<FileInfo[]>([])
  const [expandedDirectories, setExpandedDirectories] = useState<Map<string, boolean>>(new Map())
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null)
  const [currentlyOpenFilePath, setCurrentlyOpenFilePath] = useState<string | null>(null)
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState | null>()
  const [needToWriteEditorContentToDisk, setNeedToWriteEditorContentToDisk] = useState<boolean>(false)
  const [needToIndexEditorContent, setNeedToIndexEditorContent] = useState<boolean>(false)
  const [spellCheckEnabled, setSpellCheckEnabled] = useState<boolean>(false)
  const [noteToBeRenamed, setNoteToBeRenamed] = useState<string>('')
  const [fileDirToBeRenamed, setFileDirToBeRenamed] = useState<string>('')
  const [currentlyChangingFilePath, setCurrentlyChangingFilePath] = useState(false)
  const [highlightData, setHighlightData] = useState<HighlightData>({
    text: '',
    position: null,
  })

  const {
    add: addToNavigationHistory,
    remove: removeFromNavigationHistory,
    values: navigationHistory,
  } = useOrderedSet()

  useEffect(() => {
    const fetchSpellCheckMode = async () => {
      const storedSpellCheckEnabled = await window.electronStore.getSpellCheckMode()
      setSpellCheckEnabled(storedSpellCheckEnabled)
    }
    fetchSpellCheckMode()
  }, [spellCheckEnabled])

  const createFileIfNotExists = async (filePath: string, optionalContent?: string): Promise<string> => {
    const invalidChars = await getInvalidCharacterInFilePath(filePath)
    if (invalidChars) {
      const errorMessage = `Could not create note ${filePath}. Character ${invalidChars} cannot be included in note name.`
      toast.error(errorMessage)
      throw new Error(errorMessage)
    }
    const filePathWithExtension = await window.path.addExtensionIfNoExtensionPresent(filePath)
    const isAbsolutePath = await window.path.isAbsolute(filePathWithExtension)
    const absolutePath = isAbsolutePath
      ? filePathWithExtension
      : await window.path.join(await window.electronStore.getVaultDirectoryForWindow(), filePathWithExtension)

    const fileExists = await window.fileSystem.checkFileExists(absolutePath)
    if (!fileExists) {
      await window.fileSystem.createFile(absolutePath, optionalContent || ``)
      setNeedToIndexEditorContent(true)
    }

    return absolutePath
  }

  const loadFileIntoEditor = async (filePath: string) => {
    console.log(`Loading file into editor: ${filePath}`)
    setCurrentlyChangingFilePath(true)
    await writeEditorContentToDisk(editor, currentlyOpenFilePath)
    if (currentlyOpenFilePath && needToIndexEditorContent) {
      window.database.indexFileInDatabase(currentlyOpenFilePath)
      setNeedToIndexEditorContent(false)
    }
    const fileContent = (await window.fileSystem.readFile(filePath)) ?? ''
    // editor?.commands.setContent(fileContent)
    console.log(`Parsing fileCOntent: ${fileContent}`)
    const blocks = await editor.tryParseMarkdownToBlocks(fileContent)
    editor.replaceBlocks(editor.document, blocks)
    setCurrentlyOpenFilePath(filePath)
    setCurrentlyChangingFilePath(false)
    const parentDirectory = await window.path.dirname(filePath)
    setSelectedDirectory(parentDirectory)
  }

  const openOrCreateFile = async (filePath: string, optionalContentToWriteOnCreate?: string): Promise<void> => {
    console.log(`Inside openOrCreateFile: ${filePath}`)
    const absolutePath = await createFileIfNotExists(filePath, optionalContentToWriteOnCreate)
    await loadFileIntoEditor(absolutePath)
  }

  // const editor = useEditor({
  //   autofocus: true,
  //   onUpdate() {
  //     setNeedToWriteEditorContentToDisk(true)
  //     setNeedToIndexEditorContent(true)
  //   },
  //   editorProps: {},
  //   extensions: [
  //     StarterKit,
  //     Document,
  //     Paragraph,
  //     Text,
  //     TaskList,
  //     MathExtension.configure({
  //       evaluation: true,
  //     }),
  //     Table.configure({
  //       resizable: true,
  //     }),
  //     TableRow,
  //     TableHeader,
  //     TableCell,
  //     TextStyle,
  //     SearchAndReplace.configure({
  //       searchResultClass: 'bg-yellow-400',
  //       disableRegex: false,
  //     }),
  //     Markdown.configure({
  //       html: true,
  //       tightLists: true,
  //       tightListClass: 'tight',
  //       bulletListMarker: '-',
  //       linkify: true,
  //       breaks: true,
  //       transformPastedText: true,
  //       transformCopiedText: false,
  //     }),
  //     TaskItem.configure({
  //       nested: true,
  //     }),
  //     HighlightExtension(setHighlightData),
  //     RichTextLink.configure({
  //       linkOnPaste: true,
  //       openOnClick: true,
  //     }),
  //     CharacterCount,
  //   ],
  // })
  const editor: BlockNoteEditor = useCreateBlockNote()

  // useEffect(() => {
  //   if (editor) {
  //     editor.setOptions({
  //       editorProps: {
  //         attributes: {
  //           spellcheck: spellCheckEnabled.toString(),
  //         },
  //       },
  //     })
  //   }
  // }, [spellCheckEnabled, editor])

  // const [debouncedEditor] = useDebounce(editor?.state.doc.content, 3000)
  const [debouncedEditor] = useDebounce(editor.document, 3000)

  useEffect(() => {
    console.log(`File changed, writing to disk`)
    if (debouncedEditor && !currentlyChangingFilePath) {
      console.log(`Called write editor`)
      writeEditorContentToDisk(editor, currentlyOpenFilePath)
      if (editor && currentlyOpenFilePath) {
        handleNewFileRenaming(editor, currentlyOpenFilePath)
      }
    }
  }, [debouncedEditor, currentlyOpenFilePath, editor, currentlyChangingFilePath])

  const saveCurrentlyOpenedFile = async () => {
    await writeEditorContentToDisk(editor, currentlyOpenFilePath)
  }

  const writeEditorContentToDisk = async (_editor: BlockNoteEditor | null, filePath: string | null) => {
    console.log(`Inside writeEditor at filePath ${filePath}`)
    if (filePath !== null && needToWriteEditorContentToDisk && _editor) {
      const markdownContent = await getMarkdown(_editor)
      console.log(`Writing markdownContent: ${markdownContent}`)
      if (markdownContent !== null) {
        await window.fileSystem.writeFile({
          filePath,
          content: markdownContent,
        })
        setNeedToWriteEditorContentToDisk(false)
      }
    }
  }

  const handleNewFileRenaming = async (_editor: BlockNoteEditor, filePath: string) => {
    const fileInfo = vaultFilesFlattened.find((f) => f.path === filePath)
    if (
      fileInfo &&
      fileInfo.name.startsWith('Untitled') &&
      new Date().getTime() - fileInfo.dateCreated.getTime() < 60000
    ) {
      // const editorText = _editor.getText()
      // const editorText = _editor.document[0].content?.toString()
      const editorText = _editor.document[0]?.content ? _editor.document[0]?.content[0]?.text : ''
      console.log(`Found editorText: ${editorText}`)
      if (editorText) {
        const newProposedFileName = generateFileNameFromFileContent(editorText)
        if (newProposedFileName) {
          const directoryToMakeFileIn = await window.path.dirname(filePath)
          const filesInDirectory = await getFilesInDirectory(directoryToMakeFileIn, vaultFilesFlattened)
          const fileName = getNextAvailableFileNameGivenBaseName(
            filesInDirectory.map((file) => file.name),
            newProposedFileName,
          )
          const newFilePath = await window.path.join(directoryToMakeFileIn, fileName)
          await renameFile(filePath, newFilePath)
          // setCurrentlyOpenFilePath(newFilePath)
        }
      }
    }
  }

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
  }, [editor, currentlyOpenFilePath])

  const renameFile = async (oldFilePath: string, newFilePath: string) => {
    await window.fileSystem.renameFile({
      oldFilePath,
      newFilePath,
    })
    removeFromNavigationHistory(oldFilePath)
    addToNavigationHistory(newFilePath)

    if (currentlyOpenFilePath === oldFilePath) {
      setCurrentlyOpenFilePath(newFilePath)
    }
  }

  useEffect(() => {
    const handleWindowClose = async () => {
      if (currentlyOpenFilePath !== null && editor && editor.blocksToHTMLLossy() !== null) {
        const markdown = await getMarkdown(editor)
        await window.fileSystem.writeFile({
          filePath: currentlyOpenFilePath,
          content: markdown,
        })
        await window.database.indexFileInDatabase(currentlyOpenFilePath)
      }
    }

    const removeWindowCloseListener = window.ipcRenderer.receive('prepare-for-window-close', handleWindowClose)

    return () => {
      removeWindowCloseListener()
    }
  }, [currentlyOpenFilePath, editor])

  const deleteFile = async (path: string | undefined) => {
    if (!path) return false
    await window.fileSystem.deleteFile(path)
    if (currentlyOpenFilePath === path) {
      // editor?.commands.setContent('')
      editor.replaceBlocks(editor.document, [])
      setCurrentlyOpenFilePath(null)
    }
    return true
  }

  const handleDirectoryToggle = (path: string) => {
    const isExpanded = expandedDirectories.get(path)
    const newExpandedDirectories = new Map(expandedDirectories)
    newExpandedDirectories.set(path, !isExpanded)
    setExpandedDirectories(newExpandedDirectories)
  }

  useEffect(() => {
    const handleFilesListUpdateFromMainProcess = async (updatedFiles: FileInfoTree) => {
      const sortedFiles = sortFilesAndDirectories(updatedFiles, null)
      setVaultFilesTree(sortedFiles)
      const updatedFlattenedFiles = flattenFileInfoTree(sortedFiles)
      setVaultFilesFlattened(updatedFlattenedFiles)
      const directoriesToBeExpanded = await findRelevantDirectoriesToBeExpanded(
        currentlyOpenFilePath,
        expandedDirectories,
      )
      setExpandedDirectories(directoriesToBeExpanded)
    }

    const removeFilesListListener = window.ipcRenderer.receive('files-list', handleFilesListUpdateFromMainProcess)

    return () => {
      removeFilesListListener()
    }
  }, [currentlyOpenFilePath, expandedDirectories])

  useEffect(() => {
    const fetchAndSetFiles = async () => {
      const fetchedFiles = await window.fileSystem.getFilesTreeForWindow()
      const sortedFiles = sortFilesAndDirectories(fetchedFiles, null)
      setVaultFilesTree(sortedFiles)
      const updatedFlattenedFiles = flattenFileInfoTree(sortedFiles)
      setVaultFilesFlattened(updatedFlattenedFiles)
    }

    fetchAndSetFiles()
  }, [])

  const contextValues = {
    vaultFilesTree,
    vaultFilesFlattened,
    expandedDirectories,
    handleDirectoryToggle,
    currentlyOpenFilePath,
    setCurrentlyOpenFilePath,
    saveCurrentlyOpenedFile,
    editor,
    navigationHistory,
    addToNavigationHistory,
    openOrCreateFile,
    suggestionsState,
    spellCheckEnabled,
    highlightData,
    noteToBeRenamed,
    setNoteToBeRenamed,
    fileDirToBeRenamed,
    setFileDirToBeRenamed,
    renameFile,
    setSuggestionsState,
    setSpellCheckEnabled,
    deleteFile,
    selectedDirectory,
    setSelectedDirectory,
  }

  const contextValuesMemo: FileContextType = React.useMemo(
    () => ({
      ...contextValues,
    }),
    [contextValues],
  )

  return <FileContext.Provider value={contextValuesMemo}>{children}</FileContext.Provider>
}
