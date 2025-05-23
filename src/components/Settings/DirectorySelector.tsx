import React, { useEffect, useState } from 'react'

import { Button } from '@material-tailwind/react'
import { SizableText } from 'tamagui'
import { truncateName } from '../Chat/MessageComponents/ChatSources'

interface DirectorySelectorProps {
  setErrorMsg: (error: string) => void
}

const DirectorySelector: React.FC<DirectorySelectorProps> = ({ setErrorMsg }) => {
  const [userDirectory, setUserDirectory] = useState<string>('')

  const handleDirectorySelection = async () => {
    const paths = await window.fileSystem.openDirectoryDialog()
    if (paths && paths[0]) {
      setUserDirectory(paths[0])
    }
  }

  useEffect(() => {
    const fetchDirectory = async () => {
      const directory = await window.electronStore.getVaultDirectoryForWindow()
      if (directory) {
        setUserDirectory(directory)
      }
    }
    fetchDirectory()
  }, [])

  useEffect(() => {
    if (!userDirectory) {
      setErrorMsg('Please select a directory')
    } else {
      window.electronStore.setVaultDirectoryForWindow(userDirectory)
      setErrorMsg('')
    }
  }, [userDirectory, setErrorMsg])

  return (
    <div className="flex w-full max-w-60 flex-col items-end">
      <Button
        className="h-10 w-[140px] cursor-pointer border-none bg-blue-500 px-2 py-0 text-center hover:bg-blue-600"
        onClick={handleDirectorySelection}
        placeholder=""
      >
        Select Directory
      </Button>
      {userDirectory && (
        <SizableText fontSize={12} width="100%" textAlign="left" marginTop={1} fontWeight={300}>
          <strong>{truncateName(userDirectory, 60)}</strong>
        </SizableText>
      )}
    </div>
  )
}

export default DirectorySelector
