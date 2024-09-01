import { FileInfoNode } from 'electron/main/filesystem/types'
import React, { useEffect, useRef } from 'react'
import { ChatHistoryMetadata } from '../Chat/hooks/use-chat-history'
import { useModalOpeners } from '../../providers/ModalProvider'
import NewNoteComponent from '../File/NewNote'
import NewDirectoryComponent from '../File/NewDirectory'
import FlashcardMenuModal from '../Flashcard/FlashcardMenuModal'

/**
 * Name of component that user right clicked on.
 * Used to define the type for our useState
 */
export type ContextMenuLocations = 'FileSidebar' | 'FileItem' | 'ChatItem' | 'DirectoryItem' | 'None'

export interface ContextMenuFocus {
  currentSelection: ContextMenuLocations
  locations: ContextMenuPos
  file?: FileInfoNode
  chatMetadata?: ChatHistoryMetadata
}

export type HandleFocusedItemType = (
  event: React.MouseEvent<HTMLDivElement>,
  focusedItem: ContextMenuLocations,
  additionalData?: Partial<Omit<ContextMenuFocus, 'currentSelection' | 'locations'>>,
) => void

interface ContextMenuPos {
  x: number
  y: number
}

interface MenuItemType {
  title: string
  onSelect: ((...args: any[]) => void) | null
  icon: string
}

interface CustomContextMenuProps {
  focusedItem: ContextMenuFocus
  hideFocusedItem: () => void
  handleDeleteFile: (path: string | undefined) => void
  handleDeleteChat: (chatID: string | undefined) => void
  setFileNodeToBeRenamed: (newName: string) => void
  openFileAndOpenEditor: (path: string, optionalContentToWriteOnCreate?: string) => void
  handleAddFileToChatFilters: (file: string) => void
}

const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
  focusedItem,
  hideFocusedItem,
  handleDeleteFile,
  handleDeleteChat,
  setFileNodeToBeRenamed,
  openFileAndOpenEditor,
  handleAddFileToChatFilters,
}) => {
  const { currentSelection, locations, file, chatMetadata } = focusedItem
  const menuRef = useRef<HTMLDivElement>(null)

  const {
    isNewNoteModalOpen,
    setIsNewNoteModalOpen,
    isNewDirectoryModalOpen,
    setIsNewDirectoryModalOpen,
    setIsFlashcardModeOpen,
    setInitialFileToCreateFlashcard,
    isFlashcardModeOpen,
    setInitialFileToReviewFlashcard,
    initialFileToCreateFlashcard,
    initialFileToReviewFlashcard,
  } = useModalOpeners()

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        hideFocusedItem()
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    const menuElement = menuRef.current
    if (menuElement) {
      const { height } = menuElement.getBoundingClientRect()
      if (locations.y + height > window.innerHeight) {
        menuElement.style.top = `${window.innerHeight - height - 10}px`
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [hideFocusedItem, locations.y])

  const handleMakeFlashcard = (noteName: string | null) => {
    if (!noteName) return
    setIsFlashcardModeOpen(!!noteName)
    setInitialFileToCreateFlashcard(noteName)
  }

  const handleRenameFile = (name: string | undefined) => {
    if (name) setFileNodeToBeRenamed(name)
  }

  let displayList: MenuItemType[] = []
  switch (currentSelection) {
    case 'FileSidebar': {
      displayList = [
        { title: 'New Note', onSelect: () => setIsNewNoteModalOpen(true), icon: '' },
        { title: 'New Directory', onSelect: () => setIsNewDirectoryModalOpen(true), icon: '' },
      ]
      break
    }
    case 'FileItem': {
      displayList = [
        { title: 'Delete', onSelect: () => handleDeleteFile(file?.path), icon: '' },
        {
          title: 'Rename',
          onSelect: () => {
            if (file?.path) setFileNodeToBeRenamed(file?.path)
          },
          icon: '',
        },
        { title: 'Create flashcard set', onSelect: () => handleMakeFlashcard(file ? file.path : null), icon: '' },
        {
          title: 'Add File to chat context',
          onSelect: () => {
            if (file?.path) handleAddFileToChatFilters(file?.path)
          },
          icon: '',
        },
      ]
      break
    }
    case 'ChatItem': {
      displayList = [{ title: 'Delete Chat', onSelect: () => handleDeleteChat(chatMetadata?.id), icon: '' }]
      break
    }
    case 'DirectoryItem': {
      displayList = [
        { title: 'New Directory', onSelect: () => setIsNewDirectoryModalOpen(true), icon: '' },
        { title: 'New Note', onSelect: () => setIsNewNoteModalOpen(true), icon: '' },
        { title: 'Delete', onSelect: () => handleDeleteFile(file?.path), icon: '' },
        { title: 'Rename', onSelect: () => handleRenameFile(file?.path), icon: '' },
        { title: 'Create flashcard set', onSelect: () => handleMakeFlashcard(file ? file.path : null), icon: '' },
        {
          title: 'Add file to chat context',
          onSelect: () => {
            if (file?.path) handleAddFileToChatFilters(file?.path)
          },
          icon: '',
        },
      ]
      break
    }
    default:
      break
  }

  // Selects the item then hides menu
  const handleSubmit = (item: MenuItemType) => {
    if (item.onSelect) item.onSelect()
    hideFocusedItem()
  }

  return (
    <div>
      {focusedItem.currentSelection !== 'None' && (
        <div
          ref={menuRef}
          className="absolute z-[1020] overflow-y-auto rounded-md border-solid border-gray-700 bg-[#1E1E1E] px-1 py-2"
          style={{
            left: locations.x,
            top: locations.y,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
          }}
        >
          <div className="flex flex-col">
            {displayList?.map((item) => (
              <div
                className="cursor-pointer px-2 py-1 text-[12px] text-white/90 hover:rounded-md hover:bg-blue-500"
                onClick={() => handleSubmit(item)}
              >
                {item.title}
              </div>
            ))}
          </div>
        </div>
      )}
      <NewNoteComponent
        isOpen={isNewNoteModalOpen}
        onClose={() => setIsNewNoteModalOpen(false)}
        openFileAndOpenEditor={openFileAndOpenEditor}
        currentOpenFilePath={null}
        optionalAbsoluteCreate={file?.path ? file?.path : null}
      />
      <NewDirectoryComponent
        isOpen={isNewDirectoryModalOpen}
        onClose={() => setIsNewDirectoryModalOpen(false)}
        currentOpenFilePath={file?.path ? file?.path : null}
        optionalAbsoluteCreate={file?.path ? file?.path : null}
      />
      {isFlashcardModeOpen && (
        <FlashcardMenuModal
          isOpen={isFlashcardModeOpen}
          onClose={() => {
            setIsFlashcardModeOpen(false)
            setInitialFileToCreateFlashcard('')
            setInitialFileToReviewFlashcard('')
          }}
          initialFileToCreateFlashcard={initialFileToCreateFlashcard}
          initialFileToReviewFlashcard={initialFileToReviewFlashcard}
        />
      )}
    </div>
  )
}

export default CustomContextMenu
