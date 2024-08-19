import React, { useEffect, useState } from 'react'

import { FileInfoNode, FileInfoTree } from 'electron/main/filesystem/types'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { MenuChildItems } from '@/components/Common/Menus'

import RenameDirModal from '../RenameDirectory'
import RenameNoteModal from '../RenameNote'
import FileItem from './FileItem'
import { isFileNodeDirectory } from './utils'

const handleDragStartImpl = (e: React.DragEvent, file: FileInfoNode) => {
  e.dataTransfer.setData('text/plain', file.path)
  e.dataTransfer.effectAllowed = 'move'
} // Assuming FileItem is in a separate file

const Rows: React.FC<ListChildComponentProps> = ({ index, style, data }) => {
  const { visibleItems, 
    selectedFilePath, 
    onFileSelect, 
    handleDragStart, 
    handleDirectoryToggle, 
    expandedDirectories,
    handleContextMenu } = data

  const fileObject = visibleItems[index]
  return (
    <div style={style}>
      <FileItem
        file={fileObject.file}
        selectedFilePath={selectedFilePath}
        onFileSelect={onFileSelect}
        handleDragStart={handleDragStart}
        onDirectoryToggle={handleDirectoryToggle}
        isExpanded={expandedDirectories.has(fileObject.file.path) && expandedDirectories.get(fileObject.file.path)}
        indentMultiplyer={fileObject.indentMultiplyer}
        handleContextMenu={handleContextMenu}
      />
    </div>
  )
}

interface FileExplorerProps {
  files: FileInfoTree
  selectedFilePath: string | null
  onFileSelect: (path: string) => void
  handleDragStart: (event: React.DragEvent, file: FileInfoNode) => void
  expandedDirectories: Map<string, boolean>
  handleDirectoryToggle: (path: string) => void
  lheight?: number
  handleContextMenu: (event: React.MouseEvent, items: MenuChildItems[]) => void
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  selectedFilePath,
  onFileSelect,
  handleDragStart,
  expandedDirectories,
  handleDirectoryToggle,
  lheight,
  handleContextMenu
}) => {
  const [listHeight, setListHeight] = useState(lheight ?? window.innerHeight)

  useEffect(() => {
    const updateHeight = () => {
      setListHeight(lheight ?? window.innerHeight)
    }
    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [lheight])

  const getVisibleFilesAndFlatten = (
    _files: FileInfoTree,
    _expandedDirectories: Map<string, boolean>,
    indentMultiplyer = 0,
  ): { file: FileInfoNode; indentMultiplyer: number }[] => {
    let visibleItems: { file: FileInfoNode; indentMultiplyer: number }[] = []
    _files.forEach((file) => {
      const a = { file, indentMultiplyer }
      visibleItems.push(a)
      if (isFileNodeDirectory(file) && _expandedDirectories.has(file.path) && _expandedDirectories.get(file.path)) {
        if (file.children) {
          visibleItems = [
            ...visibleItems,
            ...getVisibleFilesAndFlatten(file.children, _expandedDirectories, indentMultiplyer + 1),
          ]
        }
      }
    })
    return visibleItems
  }

  // Calculate visible items and item count
  const visibleItems = getVisibleFilesAndFlatten(files, expandedDirectories)
  const itemCount = visibleItems.length

  return (
    <div className="h-full grow px-1 pt-2 opacity-70">
      <List
        height={listHeight}
        itemCount={itemCount}
        itemSize={30}
        width="100%"
        itemData={{
          visibleItems,
          selectedFilePath,
          onFileSelect,
          handleDragStart,
          handleDirectoryToggle,
          expandedDirectories,
          handleContextMenu
        }}
      >
        {Rows}
      </List>
    </div>
  )
}

interface FileListProps {
  files: FileInfoTree
  expandedDirectories: Map<string, boolean>
  handleDirectoryToggle: (path: string) => void
  selectedFilePath: string | null
  onFileSelect: (path: string) => void
  renameFile: (oldFilePath: string, newFilePath: string) => Promise<void>
  noteToBeRenamed: string
  setNoteToBeRenamed: (note: string) => void
  fileDirToBeRenamed: string
  setFileDirToBeRenamed: (dir: string) => void
  listHeight?: number
  handleContextMenu: (event: React.MouseEvent, items: MenuChildItems[]) => void
}

export const FileSidebar: React.FC<FileListProps> = ({
  files,
  expandedDirectories,
  handleDirectoryToggle,
  selectedFilePath,
  onFileSelect,
  renameFile,
  noteToBeRenamed,
  setNoteToBeRenamed,
  fileDirToBeRenamed,
  setFileDirToBeRenamed,
  listHeight,
  handleContextMenu
}) => (
  <div className="flex h-full flex-col overflow-hidden text-white">
    {noteToBeRenamed && (
      <RenameNoteModal
        isOpen={!!noteToBeRenamed}
        onClose={() => setNoteToBeRenamed('')}
        fullNoteName={noteToBeRenamed}
        renameNote={async ({ path, newNoteName }) => {
          await renameFile(path, newNoteName)
        }}
      />
    )}
    {fileDirToBeRenamed && (
      <RenameDirModal
        isOpen={!!fileDirToBeRenamed}
        onClose={() => setFileDirToBeRenamed('')}
        fullDirName={fileDirToBeRenamed}
        renameDir={async ({ path, newDirName: newNoteName }) => {
          await renameFile(path, newNoteName)
        }}
      />
    )}
    <FileExplorer
      files={files}
      selectedFilePath={selectedFilePath}
      onFileSelect={onFileSelect}
      handleDragStart={handleDragStartImpl}
      expandedDirectories={expandedDirectories}
      handleDirectoryToggle={handleDirectoryToggle}
      lheight={listHeight}
      handleContextMenu={handleContextMenu}
    />
  </div>
)

export default FileExplorer
