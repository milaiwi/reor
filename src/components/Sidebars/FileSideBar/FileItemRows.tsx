import React, { useState, useCallback, useEffect, useRef } from 'react'
import { ListChildComponentProps } from 'react-window'
import { toast } from 'react-toastify'
import posthog from 'posthog-js'
import { isFileNodeDirectory } from '@shared/utils'
import { XStack, Text } from 'tamagui'
import { ChevronRight, ChevronDown } from '@tamagui/lucide-icons'
import { useVault } from '@/components/File/VaultManager/VaultContext'
import { removeFileExtension } from '@/lib/file'
import { useContentContext } from '@/contexts/ContentContext'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import NewDirectoryComponent from '@/components/File/NewDirectory'
import { getDirname, getPathBasename, joinPaths, normalizePath } from '@/lib/utils'
import { BlockNoteEditor } from '@blocknote/core'

const FileItemRows: React.FC<ListChildComponentProps> = ({ index, style, data }) => {
  const { file, indentation } = data.filesAndIndentations[index]
  const editorRef = useRef<BlockNoteEditor | null>(null)

  const {
    toggleDirectory,
    expandedDirectories,
    editor,
    currentDirectory: selectedDirectory,
    selectDirectory,
    renameFile,
    deleteFile,
    replaceFile,
    moveDirectory,
    setNoteToBeRenamed,
    isFileInDirectory,
  } = useVault()

  const { openContent, createUntitledNote } = useContentContext()

  // Local component state
  const [isNewDirectoryModalOpen, setIsNewDirectoryModalOpen] = useState(false)
  const [parentDirectoryPathForNewDirectory, setParentDirectoryPathForNewDirectory] = useState<string | undefined>()
  const [isDragOver, setIsDragOver] = useState(false)

  // Determine if file is directory and if it's selected
  const isDirectory = isFileNodeDirectory(file)
  const isSelected = isDirectory 
    ? file.path === selectedDirectory 
    : editor?.currentFilePath ? file.path === editor.currentFilePath : false

  // Styling and UI State
  const indentationPadding = indentation ? 10 * indentation : 0
  const isExpanded = expandedDirectories.get(file.path)

  // Update editor ref whenever editor changes
  useEffect(() => {
    if (editor) {
      editorRef.current = editor
    }
  }, [editor])

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragOver(false), [])

  const handleDragStart = useCallback(
    (e: React.DragEvent) => {
      e.stopPropagation()
      e.dataTransfer.setData('text/plain', file.path)
      e.dataTransfer.effectAllowed = 'move'
      // Add a custom data attribute to identify if it's a directory
      e.dataTransfer.setData('isDirectory', isDirectory.toString())
    },
    [file.path, isDirectory],
  )

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)
      const sourcePath = e.dataTransfer.getData('text/plain')
      const isSourceDirectory = e.dataTransfer.getData('isDirectory') === 'true'
      const destinationDirectory = isDirectory ? file.path : getDirname(file.path)
      const fileName = getPathBasename(sourcePath)
      const destinationPath = joinPaths(destinationDirectory, fileName)

      // Prevent dropping a directory into itself or its subdirectories
      if (isSourceDirectory && destinationPath.startsWith(sourcePath)) {
        toast.error("Cannot move a directory into itself or its subdirectories", {
          className: 'mt-5',
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        })
        return
      }

      const currentFilePath = editorRef.current?.currentFilePath
      if (currentFilePath && normalizePath(sourcePath) === normalizePath(currentFilePath)) {
        toast.error("Cannot drag file that is currently opened", {
          className: 'mt-5',
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        })
        return
      }
      
      // If src and destination are the same, do nothing
      if (normalizePath(sourcePath) === normalizePath(destinationPath))
        return

      // Check if destination already exists
      const fileExists = isFileInDirectory(destinationDirectory, fileName)
      if (fileExists) {
        const confirmReplace = window.confirm(
          `A ${isSourceDirectory ? 'directory' : 'file'} named "${fileName}" already exists in this location. Do you want to replace it?`
        )

        if (confirmReplace) {
          try {
            if (isSourceDirectory) {
              await moveDirectory(sourcePath, destinationPath)
            } else {
              await replaceFile(normalizePath(sourcePath), normalizePath(destinationPath))
            }
          } catch (error) {
            console.error('Failed to replace:', error)
            toast.error(`Failed to replace ${isSourceDirectory ? 'directory' : 'file'}`)
          }
        }
      } else {
        try {
          if (isSourceDirectory)
            await moveDirectory(sourcePath, destinationPath)
          else
            renameFile(normalizePath(sourcePath), normalizePath(destinationPath))
          
        } catch (error) {
          console.error(`Failed to move ${isSourceDirectory ? 'directory' : 'file'}:`, error)
          toast.error(`Failed to move ${isSourceDirectory ? 'directory' : 'file'}`)
        }
      }
    },
    [file.path, isDirectory, renameFile, replaceFile, isFileInDirectory],
  )

  // Click handler for files and directories
  const clickOnFileOrDirectory = useCallback(
    (event: any) => {
      const e = event.nativeEvent
      if (isDirectory) {
        toggleDirectory(file.path)
        selectDirectory(file.path)
      } else {
        openContent(file.path)
        posthog.capture('open_file_from_sidebar')
      }
      e.stopPropagation()
    },
    [file.path, isDirectory, toggleDirectory, openContent, selectDirectory],
  )

  // Modal Handlers
  const openNewDirectoryModal = useCallback(async () => {
    const dirPath = isDirectory ? file.path : await window.path.dirname(file.path)
    setParentDirectoryPathForNewDirectory(dirPath)
    setIsNewDirectoryModalOpen(true)
  }, [file.path, isDirectory])

  // Delete handler
  const handleDelete = useCallback(() => {
    const itemType = isDirectory ? 'directory' : 'file'
    const confirmMessage = `Are you sure you want to delete this ${itemType}?${
      isDirectory ? ' This will delete all contents of the directory.' : ''
    }`

    // eslint-disable-next-line no-alert
    if (window.confirm(confirmMessage)) {
      deleteFile(file.path)
    }
  }, [deleteFile, file.path, isDirectory])

  // CSS classes for styling
  const itemClasses = `flex items-center cursor-pointer px-2 py-1 border-b border-gray-200 h-full mt-0 mb-0 font-sans text-xs leading-relaxed rounded-md ${
    isSelected ? 'font-semibold' : ''
  } ${isDragOver ? 'bg-neutral-500' : ''}`

  // Context menu items
  const renderContextMenuItems = () => (
    <>
      <ContextMenuItem
        onClick={async () => createUntitledNote(isDirectory ? file.path : getDirname(file.path))}
      >
        New file
      </ContextMenuItem>
      <ContextMenuItem onClick={openNewDirectoryModal}>New folder</ContextMenuItem>
      <ContextMenuItem onClick={() => {
        console.log('Setting note to be renamed:', file.path);
        setNoteToBeRenamed(file.path);
      }}>Rename</ContextMenuItem>
      <ContextMenuItem onClick={handleDelete}>Delete</ContextMenuItem>
    </>
  )

  return (
    <div style={{ ...style, paddingLeft: `${indentationPadding}px` }}>
      <ContextMenu>
        <ContextMenuTrigger>
          <div
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          >
            <XStack
              hoverStyle={{
                backgroundColor: '$gray7',
              }}
              backgroundColor={isSelected && !isDirectory ? '$gray7' : ''}
              onPress={clickOnFileOrDirectory}
              className={itemClasses}
              overflow="hidden"
            >
              {isDirectory && (
                <span className="mr-2 mt-1">
                  {isExpanded ? (
                    // <FaChevronDown title="Collapse Directory" />
                    <ChevronDown title="Collapse Directory" size={14} color="$gray10" />
                  ) : (
                    // <FaChevronRight title="Open Directory" />
                    <ChevronRight title="Open Directory" size={14} color="$gray10" />
                  )}
                </span>
              )}
              <Text color="$gray11" numberOfLines={1}>
                {isDirectory ? file.name : removeFileExtension(file.name)}
              </Text>
            </XStack>
            <NewDirectoryComponent
              isOpen={isNewDirectoryModalOpen}
              onClose={() => setIsNewDirectoryModalOpen(false)}
              parentDirectoryPath={parentDirectoryPathForNewDirectory}
            />
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>{renderContextMenuItems()}</ContextMenuContent>
      </ContextMenu>
    </div>
  )
}

export default FileItemRows
