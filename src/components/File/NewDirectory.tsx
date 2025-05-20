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
  const [directoryName, setDirectoryName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { currentDirectory, createDirectory } = useVault()

  useEffect(() => {
    if (!isOpen) {
      setDirectoryName('')
      setErrorMessage(null)
    }
  }, [isOpen])

  const handleNameChange = (newName: string) => {
    setDirectoryName(newName)
  }

  const createNewDirectory = async () => {
    const invalidName = getInvalidCharacterInFilePath(directoryName) // if true, there is invalid
    if (invalidName) {
      setErrorMessage(`Directory cannot have invalid characters ${invalidName} in file name.`)
      return
    }

    if (!directoryName) return

    if (currentDirectory) {
      const finalPath = joinPaths(currentDirectory, directoryName)
      createDirectory(finalPath)
    }
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
          value={directoryName}
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
