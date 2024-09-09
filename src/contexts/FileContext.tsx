/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-use-before-define */
import React, { createContext, useContext, ReactNode, useEffect, useRef, useState } from 'react'
import { MathExtension } from '@aarkue/tiptap-math-extension'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Table from '@tiptap/extension-table'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import Text from '@tiptap/extension-text'
import TextStyle from '@tiptap/extension-text-style'
import { Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { toast } from 'react-toastify'
import { Markdown } from 'tiptap-markdown'
import { useDebounce } from 'use-debounce'
import TurndownService from 'turndown';
import useFileInfoTreeHook from '@/components/Sidebars/FileSideBar/hooks/use-file-info-tree'
import { getInvalidCharacterInFilePath } from '@/utils/strings'
import { BacklinkExtension } from '@/components/Editor/BacklinkExtension'
import { SuggestionsState } from '@/components/Editor/BacklinkSuggestionsDisplay'
import HighlightExtension, { HighlightData } from '@/components/Editor/HighlightExtension'
import { RichTextLink } from '@/components/Editor/RichTextLink'
import 'katex/dist/katex.min.css'
import '@/styles/tiptap.scss'
import SearchAndReplace from '@/components/Editor/Search/SearchAndReplaceExtension'
import getMarkdown from '@/components/Editor/utils'
import welcomeNote from '@/components/File/utils'
import { marked } from 'marked'; 

type FileContextType = {
  currentlyOpenFilePath: string | null
  setCurrentlyOpenFilePath: React.Dispatch<React.SetStateAction<string | null>>
  saveCurrentlyOpenedFile: () => Promise<void>
  editor: Editor | null
  navigationHistory: string[]
  setNavigationHistory: React.Dispatch<React.SetStateAction<string[]>>
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
} & ReturnType<typeof useFileInfoTreeHook>

export const FileContext = createContext<FileContextType | undefined>(undefined)

export const useFileContext = () => {
  const context = useContext(FileContext)
  if (context === undefined) {
    throw new Error('useFileContext must be used within a FileProvider')
  }
  return context
}

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentlyOpenFilePath, setCurrentlyOpenFilePath] = useState<string | null>(null)
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState | null>()
  const [needToWriteEditorContentToDisk, setNeedToWriteEditorContentToDisk] = useState<boolean>(false)
  const [needToIndexEditorContent, setNeedToIndexEditorContent] = useState<boolean>(false)
  const [spellCheckEnabled, setSpellCheckEnabled] = useState<boolean>(false)
  const [noteToBeRenamed, setNoteToBeRenamed] = useState<string>('')
  const [fileDirToBeRenamed, setFileDirToBeRenamed] = useState<string>('')
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])
  const [currentlyChangingFilePath, setCurrentlyChangingFilePath] = useState(false)
  const [highlightData, setHighlightData] = useState<HighlightData>({
    text: '',
    position: null,
  })

  // Initialize TurndownService
  const turndownService = new TurndownService({
    headingStyle: 'atx',   // Use # for headings
    bulletListMarker: '-', // Use - for bullet points
    blankReplacement: function (content, node) {
      if (node.nodeName === 'P' && node.innerHTML.trim() === '&nbsp;') {
        console.log("Found nbsp")
        return '<br/>';
      }
    },
  });

  useEffect(() => {
    const fetchSpellCheckMode = async () => {
      const storedSpellCheckEnabled = await window.electronStore.getSpellCheckMode()
      setSpellCheckEnabled(storedSpellCheckEnabled)
    }
    fetchSpellCheckMode()
  }, [spellCheckEnabled])

  const setFileNodeToBeRenamed = async (filePath: string) => {
    const isDirectory = await window.fileSystem.isDirectory(filePath)
    if (isDirectory) {
      setFileDirToBeRenamed(filePath)
    } else {
      setNoteToBeRenamed(filePath)
    }
  }

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

  const postprocessBreaksToParagraphs = (htmlContent) => {
    return htmlContent.replace(/<p>\s*(<br\s*\/?>\s*)+<\/p>/g, (match) => {
      const brCount = (match.match(/<br\s*\/?>/g) || []).length;
      return '<p>&nbsp;</p>'.repeat(brCount);
    });
  };

  const loadFileIntoEditor = async (filePath: string) => {
    setCurrentlyChangingFilePath(true)
    await writeEditorContentToDisk(editor, currentlyOpenFilePath)
    if (currentlyOpenFilePath && needToIndexEditorContent) {
      window.fileSystem.indexFileInDatabase(currentlyOpenFilePath)
      setNeedToIndexEditorContent(false)
    }
    const fileContent = (await window.fileSystem.readFile(filePath)) ?? ''
    // const markdownContent = fileContent.replace(/&nbsp;/g, '\n\n');
    const markedToHtmlContent = await marked.parse(fileContent);
    console.log("LOGGING marked to html:", markedToHtmlContent)
    const htmlContent = postprocessBreaksToParagraphs(markedToHtmlContent)
    console.log("LOGGING Html contnet:", htmlContent)

    editor?.commands.setContent(htmlContent)
    setCurrentlyOpenFilePath(filePath)
    setCurrentlyChangingFilePath(false)
  }

  const openOrCreateFile = async (filePath: string, optionalContentToWriteOnCreate?: string): Promise<void> => {
    const absolutePath = await createFileIfNotExists(filePath, optionalContentToWriteOnCreate)
    await loadFileIntoEditor(absolutePath)
  }

  const openRelativePathRef = useRef<(newFilePath: string) => Promise<void>>()

  const editor = useEditor({
    autofocus: true,
    onUpdate() {
      setNeedToWriteEditorContentToDisk(true)
      setNeedToIndexEditorContent(true)
    },
    editorProps: {},
    extensions: [
      StarterKit,
      Document,
      Paragraph,
      Text,
      TaskList,
      MathExtension.configure({
        evaluation: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextStyle,
      SearchAndReplace.configure({
        searchResultClass: 'bg-yellow-400',
        disableRegex: false,
      }),
      Markdown.configure({
        html: true,
        tightLists: true,
        tightListClass: 'tight',
        bulletListMarker: '-',
        linkify: true,
        breaks: true,
        transformPastedText: true,
        transformCopiedText: false,
      }),
      TaskItem.configure({
        nested: true,
      }),
      HighlightExtension(setHighlightData),
      RichTextLink.configure({
        linkOnPaste: true,
        openOnClick: true,
      }),
      BacklinkExtension(openRelativePathRef, setSuggestionsState),
    ],
  })

  useEffect(() => {
    if (editor) {
      editor.setOptions({
        editorProps: {
          attributes: {
            spellcheck: spellCheckEnabled.toString(),
          },
        },
      })
    }
  }, [spellCheckEnabled, editor])

  const [debouncedEditor] = useDebounce(editor?.state.doc.content, 4000)

  useEffect(() => {
    if (debouncedEditor && !currentlyChangingFilePath) {
      writeEditorContentToDisk(editor, currentlyOpenFilePath)
    }
  }, [debouncedEditor, currentlyOpenFilePath, editor, currentlyChangingFilePath])

  const saveCurrentlyOpenedFile = async () => {
    await writeEditorContentToDisk(editor, currentlyOpenFilePath)
  }


  const writeEditorContentToDisk = async (_editor: Editor | null, filePath: string | null) => {
    if (filePath !== null && needToWriteEditorContentToDisk && _editor) {
      // const markdownContent = getMarkdown(_editor)
      const htmlContent = editor?.getHTML()
      if (htmlContent === undefined) return
      const markdownContent = htmlContent.replace(/<p><\/p>/g, '<p>&nbsp;</p>');
      console.log("Logging replacement markdown:", markdownContent)
      let writableContent = turndownService.turndown(markdownContent);
      console.log("LOGGING Markdown content:", writableContent)

      if (markdownContent !== null) {
        await window.fileSystem.writeFile({
          filePath,
          content: writableContent,
        })
        setNeedToWriteEditorContentToDisk(false)
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

  const renameFileNode = async (oldFilePath: string, newFilePath: string) => {
    await window.fileSystem.renameFileRecursive({
      oldFilePath,
      newFilePath,
    })
    const navigationHistoryUpdated = [...navigationHistory].map((path) => path.replace(oldFilePath, newFilePath))

    setNavigationHistory(navigationHistoryUpdated)

    if (currentlyOpenFilePath === oldFilePath) {
      setCurrentlyOpenFilePath(newFilePath)
    }
  }

  useEffect(() => {
    const handleWindowClose = async () => {
      if (currentlyOpenFilePath !== null && editor && editor.getHTML() !== null) {
        const markdown = getMarkdown(editor)
        await window.fileSystem.writeFile({
          filePath: currentlyOpenFilePath,
          content: markdown,
        })
        await window.fileSystem.indexFileInDatabase(currentlyOpenFilePath)
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
      editor?.commands.setContent('')
      setCurrentlyOpenFilePath(null)
    }
    return true
  }

  const fileByFilepathValue = {
    currentlyOpenFilePath,
    setCurrentlyOpenFilePath,
    saveCurrentlyOpenedFile,
    editor,
    navigationHistory,
    setNavigationHistory,
    openOrCreateFile,
    suggestionsState,
    spellCheckEnabled,
    highlightData,
    noteToBeRenamed,
    setNoteToBeRenamed,
    fileDirToBeRenamed,
    setFileDirToBeRenamed,
    renameFile: renameFileNode,
    setFileNodeToBeRenamed,
    setSuggestionsState,
    setSpellCheckEnabled,
    deleteFile,
  }

  const fileInfoTreeValue = useFileInfoTreeHook(currentlyOpenFilePath)

  const combinedContextValue: FileContextType = React.useMemo(
    () => ({
      ...fileByFilepathValue,
      ...fileInfoTreeValue,
    }),
    [fileByFilepathValue, fileInfoTreeValue],
  )

  return <FileContext.Provider value={combinedContextValue}>{children}</FileContext.Provider>
}
