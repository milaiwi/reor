import React, { useEffect, useState } from 'react'

import { Button } from '@material-tailwind/react'
import posthog from 'posthog-js'

import { Input, H3 } from 'tamagui'
import { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native'
import ReorModal from '../Common/Modal'
import { getInvalidCharacterInFilePath } from '@/lib/file'
import { useVault } from './VaultManager/VaultContext'
import { getPlatformSpecificSep, getRelativePath, joinPaths } from '@/lib/utils'

interface NewDirectoryComponentProps {
  isOpen: boolean
  onClose: () => void
  parentDirectoryPath?: string
}

const NewDirectoryComponent: React.FC<NewDirectoryComponentProps> = ({ isOpen, onClose, parentDirectoryPath }) => {
  const [directoryRelativePath, setDirectoryRelativePath] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // const { selectedDirectory } = useFileContext()
  const { currentDirectory, vaultDirectory, createDirectory } = useVault()

  console.log(`Current directory: `, currentDirectory)

  useEffect(() => {
    const setupInitialPath = async () => {

      let fullPath = ''
      if (parentDirectoryPath) {
        fullPath = parentDirectoryPath
      } else if (currentDirectory) {
        fullPath = currentDirectory
      }

      if (fullPath) {
        const relativePath = getRelativePath(vaultDirectory, fullPath)
        const pathWithSeparator = relativePath ? `${relativePath}${getPlatformSpecificSep()}` : ''
        setDirectoryRelativePath(pathWithSeparator)
      }
    }

    if (isOpen) {
      setupInitialPath()
    }
  }, [isOpen, parentDirectoryPath, currentDirectory])

  useEffect(() => {
    if (!isOpen) {
      setDirectoryRelativePath('')
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleValidName = (name: string) => {
    const invalidCharacters = getInvalidCharacterInFilePath(name)
    if (invalidCharacters) {
      setErrorMessage(`Cannot put ${invalidCharacters} in file name`)
      return false
    }
    setErrorMessage(null)
    return true
  }

  const handleNameChange = (newName: string) => {
    handleValidName(newName)
    setDirectoryRelativePath(newName)
  }

  const createNewDirectory = async () => {
    const validName = handleValidName(directoryRelativePath)
    if (!directoryRelativePath || errorMessage || !validName) return

    const directoryPath = vaultDirectory

    const finalPath = joinPaths(directoryPath, directoryRelativePath)
    createDirectory(finalPath)
    posthog.capture('created_new_directory_from_new_directory_modal')
    onClose()
  }

  return (
    <ReorModal isOpen={isOpen} onClose={onClose}>
      <div className="my-2 ml-3 mr-6 h-full min-w-[400px]">
        <H3 color="$gray13" fontWeight="semi-bold">
          New Directory
        </H3>
        <Input
          width="100%"
          height="$3"
          fontSize="$1"
          borderRadius="$3"
          borderWidth={1}
          borderColor="$gray7"
          paddingHorizontal="$3"
          paddingVertical="$2"
          focusStyle={{ borderColor: '$blue7', outlineStyle: 'none' }}
          value={directoryRelativePath}
          onChangeText={handleNameChange}
          onKeyPress={(e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
            if (e.nativeEvent.key === 'Enter') {
              createNewDirectory()
            }
          }}
          placeholder="Directory Name"
          marginTop="$3"
          autoFocus
        />

        <div className="flex items-center gap-3">
          <Button
            className="mb-2 mt-3 h-10 w-[80px] cursor-pointer border-none bg-blue-500 px-2 py-0 text-center hover:bg-blue-600"
            onClick={createNewDirectory}
            placeholder=""
          >
            Create
          </Button>
          {errorMessage && <p className="text-xs text-red-500">{errorMessage}</p>}
        </div>
      </div>
    </ReorModal>
  )
}

export default NewDirectoryComponent
