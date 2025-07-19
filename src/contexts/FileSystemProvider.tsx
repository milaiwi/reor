import React, { createContext, useContext, ReactNode, useEffect, useState, useCallback } from 'react'
import { toast } from 'react-toastify'
import { FileInfo, FileInfoTree } from 'electron/main/filesystem/types'
import {
  findRelevantDirectoriesToBeExpanded,
  flattenFileInfoTree,
  generateFileNameFromFileContent,
  getFilesInDirectory,
  getInvalidCharacterInFilePath,
  getNextAvailableFileNameGivenBaseName,
  sortFilesAndDirectories,
} from '@/lib/file'
import { useFileCache } from './FileCache'

type FileSystemContextType = {
  // File tree state
  vaultFilesTree: FileInfoTree
  vaultFilesFlattened: FileInfo[]
  expandedDirectories: Map<string, boolean>
  
  // File operations
  createFileIfNotExists: (filePath: string, optionalContent?: string) => Promise<FileInfo>
  renameFile: (oldFilePath: string, newFilePath: string) => Promise<void>
  deleteFile: (path: string | undefined) => Promise<boolean>
  
  // File tree management
  handleDirectoryToggle: (path: string) => void
  refreshFileTree: () => Promise<void>
  
  // File content operations
  readFileContent: (filePath: string) => Promise<string | null>
  writeFileContent: (filePath: string, content: string) => Promise<void>
  prefetchFile: (filePath: string) => Promise<void>
  
  // Auto-rename logic
  handleNewFileRenaming: (filePath: string, content: string) => Promise<string | null>
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined)

export const useFileSystem = () => {
  const context = useContext(FileSystemContext)
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider')
  }
  return context
}

export const FileSystemProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [vaultFilesTree, setVaultFilesTree] = useState<FileInfoTree>([])
  const [vaultFilesFlattened, setVaultFilesFlattened] = useState<FileInfo[]>([])
  const [expandedDirectories, setExpandedDirectories] = useState<Map<string, boolean>>(new Map())
  
  const { readFileDirect, writeFileDirect, prefetchFile: prefetchFileCache } = useFileCache()

  // File tree management
  const refreshFileTree = useCallback(async () => {
    const fetchedFiles = await window.fileSystem.getFilesTreeForWindow()
    const sortedFiles = sortFilesAndDirectories(fetchedFiles, null)
    setVaultFilesTree(sortedFiles)
    const updatedFlattenedFiles = flattenFileInfoTree(sortedFiles)
    setVaultFilesFlattened(updatedFlattenedFiles)
  }, [])

  const handleDirectoryToggle = (path: string) => {
    const isExpanded = expandedDirectories.get(path)
    const newExpandedDirectories = new Map(expandedDirectories)
    newExpandedDirectories.set(path, !isExpanded)
    setExpandedDirectories(newExpandedDirectories)
  }

  // File operations
  const createFileIfNotExists = async (filePath: string, optionalContent?: string): Promise<FileInfo> => {
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
    let fileObject = null
    
    if (!fileExists) {
      fileObject = await window.fileSystem.createFile(absolutePath, optionalContent || ``)
      if (!fileObject) throw new Error(`Could not create file ${filePathWithExtension}`)
    } else {
      fileObject = await window.fileSystem.getFileInfo(absolutePath, filePathWithExtension)
    }

    return fileObject
  }

  const renameFile = async (oldFilePath: string, newFilePath: string) => {
    await window.fileSystem.renameFile({
      oldFilePath,
      newFilePath,
    })
  }

  const deleteFile = async (path: string | undefined) => {
    if (!path) return false
    await window.fileSystem.deleteFile(path)
    return true
  }

  // File content operations
  const readFileContent = async (filePath: string): Promise<string | null> => {
    return await readFileDirect(filePath)
  }

  const writeFileContent = async (filePath: string, content: string): Promise<void> => {
    await writeFileDirect(filePath, content)
  }

  const prefetchFile = async (filePath: string): Promise<void> => {
    await prefetchFileCache(filePath)
  }

  // Auto-rename logic
  const handleNewFileRenaming = async (filePath: string, content: string): Promise<string | null> => {
    const fileInfo = vaultFilesFlattened.find((f) => f.path === filePath)
    if (
      fileInfo &&
      fileInfo.name.startsWith('Untitled') &&
      new Date().getTime() - fileInfo.dateCreated.getTime() < 60000
    ) {
      const newProposedFileName = generateFileNameFromFileContent(content)
      if (newProposedFileName) {
        const directoryToMakeFileIn = await window.path.dirname(filePath)
        const filesInDirectory = await getFilesInDirectory(directoryToMakeFileIn, vaultFilesFlattened)
        const fileName = getNextAvailableFileNameGivenBaseName(
          filesInDirectory.map((file) => file.name),
          newProposedFileName,
        )
        const newFilePath = await window.path.join(directoryToMakeFileIn, fileName)
        await renameFile(filePath, newFilePath)
        return newFilePath
      }
    }
    return null
  }

  // Listen for file system updates
  useEffect(() => {
    const handleFilesListUpdateFromMainProcess = async (updatedFiles: FileInfoTree) => {
      const sortedFiles = sortFilesAndDirectories(updatedFiles, null)
      setVaultFilesTree(sortedFiles)
      const updatedFlattenedFiles = flattenFileInfoTree(sortedFiles)
      setVaultFilesFlattened(updatedFlattenedFiles)
    }

    const removeFilesListListener = window.ipcRenderer.receive('files-list', handleFilesListUpdateFromMainProcess)

    return () => {
      removeFilesListListener()
    }
  }, [setVaultFilesTree, setVaultFilesFlattened])

  // Initial file tree load
  useEffect(() => {
    refreshFileTree()
  }, [refreshFileTree])

  const contextValue: FileSystemContextType = {
    vaultFilesTree,
    vaultFilesFlattened,
    expandedDirectories,
    createFileIfNotExists,
    renameFile,
    deleteFile,
    handleDirectoryToggle,
    refreshFileTree,
    readFileContent,
    writeFileContent,
    prefetchFile,
    handleNewFileRenaming,
  }

  return (
    <FileSystemContext.Provider value={contextValue}>
      {children}
    </FileSystemContext.Provider>
  )
} 