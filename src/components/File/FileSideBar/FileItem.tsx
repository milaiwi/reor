import React, { useState } from 'react'
import CustomContextMenu from '@/components/Common/Menus'
import { MenuChildItems } from '@/components/Common/Menus'

import { FileInfoNode } from 'electron/main/filesystem/types'
import posthog from 'posthog-js'
import { FaChevronDown, FaChevronRight } from 'react-icons/fa'

import { isFileNodeDirectory, moveFile } from './utils'

import { removeFileExtension } from '@/utils/strings'

interface FileInfoProps {
  file: FileInfoNode
  selectedFilePath: string | null
  onFileSelect: (path: string) => void
  handleDragStart: (e: React.DragEvent, file: FileInfoNode) => void
  onDirectoryToggle: (path: string) => void
  isExpanded?: boolean
  indentMultiplyer?: number
  handleContextMenu: (event: React.MouseEvent, items: MenuChildItems[]) => void
}

const FileItem: React.FC<FileInfoProps> = ({
  file,
  selectedFilePath,
  onFileSelect,
  handleDragStart,
  onDirectoryToggle,
  isExpanded,
  indentMultiplyer,
  handleContextMenu
}) => {
  const isDirectory = isFileNodeDirectory(file)
  const isSelected = file.path === selectedFilePath
  const indentation = indentMultiplyer ? 10 * indentMultiplyer : 0
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false) // Reset drag over state
    const sourcePath = e.dataTransfer.getData('text/plain')
    let destinationPath = file.path // Default destination path is the path of the file item itself

    if (!isFileNodeDirectory(file)) {
      const pathSegments = file.path.split('/')
      pathSegments.pop() // Remove the file name from the path
      destinationPath = pathSegments.join('/')
    }

    try {
      moveFile(sourcePath, destinationPath)
      // Refresh file list here or in moveFile function
    } catch (error) {
      // Handle error (e.g., show an error message)
    }
  }

  const toggle = () => {
    if (isFileNodeDirectory(file)) {
      onDirectoryToggle(file.path)
    } else {
      onFileSelect(file.path)
      posthog.capture('open_file_from_sidebar')
    }
  }

  const localHandleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    handleDragStart(e, file)
  }

  // const handleContextMenu = (e: React.MouseEvent) => {
  //   e.preventDefault()
  //   e.stopPropagation()
  //   window.electronUtils.showFileItemContextMenu(file)
  // }

  const itemClasses = `flex items-center cursor-pointer px-2 py-1 border-b border-gray-200 hover:bg-neutral-700 h-full mt-0 mb-0 text-cyan-100 font-sans text-xs leading-relaxed rounded-md ${
    isSelected ? 'bg-neutral-700 text-white font-semibold' : 'text-gray-200'
  } ${isDragOver ? 'bg-neutral-500' : ''}`

  const menuItems: MenuChildItems[] = [
    { name: 'New Note', onSelect: () => console.log('New Note') },
    { name: 'New Directory', onSelect: () => console.log('New Directory') },
    { name: 'Delete', onSelect: () => window.ipcRenderer.send('rename-file-listener', file.path) },
    { name: 'Rename', onSelect: () => console.log('Renaming Note') },
    { name: 'Create a flashcard set', onSelect: () => console.log('Create a flashcard') },
    { name: 'Add a file to chat context', onSelect: () => console.log("Add to chat context") },
  ]

  return (
    <div
      draggable
      onDragStart={localHandleDragStart}
      onContextMenu={(e) => handleContextMenu(e, menuItems)}
      style={{ paddingLeft: `${indentation}px` }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
    >
      <div onClick={toggle} className={itemClasses}>
        {isDirectory && (
          <span className="mr-2 mt-1 text-gray-200/20 ">
            {isExpanded ? <FaChevronDown title="Collapse Directory" /> : <FaChevronRight title="Open Directory" />}
          </span>
        )}
        <span className="mt-0 flex-1 truncate">{isDirectory ? file.name : removeFileExtension(file.name)}</span>
      </div>
    </div>
  )
}

export default FileItem
