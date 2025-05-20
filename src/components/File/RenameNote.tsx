import React, { useState, useEffect } from 'react'

import { Button } from '@material-tailwind/react'
import { toast } from 'react-toastify'

import { YStack, SizableText, Input, XStack } from 'tamagui'
import { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native'
import ReorModal from '../Common/Modal'

import { getInvalidCharacterInFileName } from '@/lib/file'
import { useVault } from './VaultManager/VaultContext'
import { addExtensionIfNoExtensionPresent, getDirname, joinPaths } from '@/lib/utils'

const RenameNoteModal: React.FC = () => {
  const { noteToBeRenamed, setNoteToBeRenamed, renameFile } = useVault()
  const [newNoteName, setNewNoteName] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Reset newNoteName when noteToBeRenamed changes
  useEffect(() => {
    if (noteToBeRenamed) {
      setNewNoteName('');
      setErrorMessage(null);
    }
  }, [noteToBeRenamed]);

  const handleNameChange = (name: string) => {
    setNewNoteName(name)

    const invalidCharacter = getInvalidCharacterInFileName(name)
    if (invalidCharacter) {
      setErrorMessage(`The character [${invalidCharacter}] cannot be included in note name.`)
    } else {
      setErrorMessage(null)
    }
  }

  const onClose = () => {
    setNoteToBeRenamed(null)
    setNewNoteName('')
    setErrorMessage(null)
  }

  const handleNoteRename = () => {
    console.log('Handling rename:', { noteToBeRenamed, newNoteName });
    if (errorMessage || !noteToBeRenamed)
      return
    if (!newNoteName) {
      toast.error('Note name cannot be empty', {
        className: 'mt-5',
        closeOnClick: false,
        draggable: false,
      })
      return
    }

    const initialNotePathPrefix = getDirname(noteToBeRenamed)
    const initialPath = joinPaths(initialNotePathPrefix, newNoteName)
    const outputPath = addExtensionIfNoExtensionPresent(initialPath)

    try {
      renameFile(noteToBeRenamed, outputPath)
      onClose()
    } catch (error) {
      console.error('Failed to rename:', error);
      toast.error('Failed to rename note', {
        className: 'mt-5',
        closeOnClick: false,
        draggable: false,
      })
    }
  }

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
    if (e.nativeEvent.key === 'Enter') {
      handleNoteRename()
    }
  }

  console.log('RenameNote render:', { noteToBeRenamed, newNoteName });
  return (
    <ReorModal isOpen={!!noteToBeRenamed} onClose={onClose}>
      <YStack my={2} ml={3} mr={6} h="100%" minWidth={400}>
        <SizableText mb={3} fontSize={18} fontWeight="bold">
          Rename Note
        </SizableText>

        <Input
          width="100%"
          borderRadius="$4"
          borderWidth={1}
          borderColor="$gray6"
          mt={10}
          value={newNoteName || ''}
          onChangeText={handleNameChange}
          onKeyPress={handleKeyPress}
          fontSize="$1"
          height="$3"
          placeholder="New Note Name"
          focusStyle={{
            borderColor: '$blue6',
            outlineWidth: 0,
          }}
        />

        <XStack alignItems="center" gap={12}>
          <Button
            className="mb-2 mt-3 h-[40px] w-[80px] cursor-pointer border-none bg-blue-500 px-2 py-0 text-center hover:bg-blue-600"
            onClick={handleNoteRename}
          >
            Rename
          </Button>
          {errorMessage && (
            <SizableText fontSize={12} color="$red10">
              {errorMessage}
            </SizableText>
          )}
        </XStack>
      </YStack>
    </ReorModal>
  )
}

export default RenameNoteModal
