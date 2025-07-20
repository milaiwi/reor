import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { Button } from '@material-tailwind/react'
import { useFileContext } from '@/contexts/FileContext'
import { Input } from '@/components/ui/input'
import ReorModal from '../Common/Modal'

interface NewDirectoryComponentProps {
  isOpen: boolean
  onClose: () => void
  parentDirectoryPath?: string
}

const NewDirectoryComponent: React.FC<NewDirectoryComponentProps> = ({ isOpen, onClose, parentDirectoryPath }) => {
  const [newDirectoryName, setNewDirectoryName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleNameChange = (name: string) => {
    setNewDirectoryName(name)
    setErrorMessage(null)
  }

  const handleCreateDirectory = async () => {
    if (!newDirectoryName.trim()) {
      toast.error('Directory name cannot be empty', {
        className: 'mt-5',
        closeOnClick: false,
        draggable: false,
      })
      return
    }

    if (!parentDirectoryPath) {
      toast.error('Parent directory path is required', {
        className: 'mt-5',
        closeOnClick: false,
        draggable: false,
      })
      return
    }

    try {
      const fullPath = await window.path.join(parentDirectoryPath, newDirectoryName)
      await window.fileSystem.createDirectory(fullPath)
      setNewDirectoryName('')
      onClose()
    } catch (error) {
      setErrorMessage('Failed to create directory. Please try again.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateDirectory()
    }
  }

  return (
    <ReorModal isOpen={isOpen} onClose={onClose}>
      <div className="my-2 ml-3 mr-6 h-full min-w-[400px]">
        <h3 className="mb-3 text-lg font-bold">
          Create New Directory
        </h3>

        <Input
          className="w-full rounded-md border border-gray-600 mt-10 px-3 py-2 text-sm h-12 placeholder-gray-400 focus:border-blue-600 focus:outline-none"
          value={newDirectoryName}
          onChange={(e) => handleNameChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Directory Name"
        />

        <div className="flex items-center gap-12">
          <Button
            className="mb-2 mt-3 h-[40px] w-[80px] cursor-pointer border-none bg-blue-500 px-2 py-0 text-center hover:bg-blue-600"
            onClick={handleCreateDirectory}
          >
            Create
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

export default NewDirectoryComponent
