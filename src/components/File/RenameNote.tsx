import React, { useState } from 'react'

import { Button } from '@material-tailwind/react'
import { toast } from 'react-toastify'

import ReorModal from '../Common/Modal'

import { getInvalidCharacterInFileName } from '@/lib/file'
import { useFileContext } from '@/contexts/FileContext'

const RenameNoteModal: React.FC = () => {
  const { noteToBeRenamed, setNoteToBeRenamed, renameFile } = useFileContext()
  const [newNoteName, setNewNoteName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleNameChange = (name: string) => {
    // const newName = e.target.value
    setNewNoteName(name)

    const invalidCharacter = getInvalidCharacterInFileName(name)
    if (invalidCharacter) {
      setErrorMessage(`The character [${invalidCharacter}] cannot be included in note name.`)
    } else {
      setErrorMessage(null)
    }
  }
  const onClose = () => {
    setNoteToBeRenamed('')
  }

  const handleNoteRename = async () => {
    if (errorMessage) {
      return
    }
    if (!newNoteName) {
      toast.error('Note name cannot be empty', {
        className: 'mt-5',
        closeOnClick: false,
        draggable: false,
      })
      return
    }

    const initialNotePathPrefix = await window.path.dirname(noteToBeRenamed)
    const initialPath = await window.path.join(initialNotePathPrefix, newNoteName)
    const outputPath = await window.path.addExtensionIfNoExtensionPresent(initialPath)

    await renameFile(noteToBeRenamed, outputPath)
    onClose()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNoteRename()
    }
  }

  return (
    <ReorModal isOpen={!!noteToBeRenamed} onClose={onClose}>
      <div className="my-2 ml-3 mr-6 h-full min-w-[400px]">
        <h3 className="mb-3 text-lg font-bold">
          Rename Note
        </h3>

        <input
          className="w-full rounded-md border border-gray-600 mt-10 px-3 py-2 text-sm h-12 placeholder-gray-400 focus:border-blue-600 focus:outline-none"
          value={newNoteName}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="New Note Name"
        />

        <div className="flex items-center gap-12">
          <Button
            className="mb-2 mt-3 h-[40px] w-[80px] cursor-pointer border-none bg-blue-500 px-2 py-0 text-center hover:bg-blue-600"
            onClick={handleNoteRename}
          >
            Rename
          </Button>
          {errorMessage && (
            <p className="text-xs text-red-500">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </ReorModal>
  )
}

export default RenameNoteModal
