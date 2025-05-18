import React, { useEffect, useState } from 'react'
import { FixedSizeList } from 'react-window'
import { YStack } from 'tamagui'
import { useVault } from '@/components/File/VaultManager/VaultContext'
import FileItemRows from './FileItemRows'

import { FileInfoNode, FileInfoTree } from 'electron/main/filesystem/types'
import { isFileNodeDirectory } from '@shared/utils'
import { useFileContext } from '@/contexts/FileContext'

const getFilesAndIndentationsForSidebar = (
  files: FileInfoTree,
  expandedDirectories: Map<string, boolean>,
  indentation = 0,
): { file: FileInfoNode; indentation: number }[] => {
  let filesAndIndexes: { file: FileInfoNode; indentation: number }[] = []
  files.forEach((file) => {
    filesAndIndexes.push({ file, indentation })
    if (isFileNodeDirectory(file) && expandedDirectories.has(file.path) && expandedDirectories.get(file.path)) {
      if (file.children) {
        filesAndIndexes = [
          ...filesAndIndexes,
          ...getFilesAndIndentationsForSidebar(file.children, expandedDirectories, indentation + 1),
        ]
      }
    }
  })
  return filesAndIndexes
}

interface FileExplorerProps {
  lheight?: number
}

const FileSidebar: React.FC<FileExplorerProps> = ({ lheight }) => {
  // const { state, actions } = useThemeManager()
  const [listHeight, setListHeight] = useState(lheight ?? window.innerHeight - 50)
  // const { vaultFilesTree, expandedDirectories, renameFile, setSelectedDirectory } = useFileContext()
  const {
    fileTree,
    expandedDirectories,
    renameFile,
    selectDirectory
  } = useVault()

  console.log(`FileTreE: `, fileTree)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const sourcePath = e.dataTransfer.getData('text/plain')
    const destinationDirectory = await window.electronStore.getVaultDirectoryForWindow()
    const destinationPath = await window.path.join(destinationDirectory, await window.path.basename(sourcePath))
    renameFile(sourcePath, destinationPath)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleClick = () => {
    selectDirectory(null)
  }

  useEffect(() => {
    const updateHeight = () => {
      setListHeight(lheight ?? window.innerHeight - 50)
    }
    window.addEventListener('resize', updateHeight)
    return () => {
      window.removeEventListener('resize', updateHeight)
    }
  }, [lheight])

  if (!fileTree) {
    // TODO: Test this
    return <YStack backgroundColor="$gray3" className="grow px-1 pt-2" />
  }

  const filesAndIndentations = getFilesAndIndentationsForSidebar(fileTree, expandedDirectories)
  const itemCount = filesAndIndentations.length

  return (
    <YStack className="h-full grow px-1 pt-2" backgroundColor="$gray3">
      <div onDrop={handleDrop} onDragOver={handleDragOver} onClick={handleClick}>
        <FixedSizeList
          height={listHeight}
          itemCount={itemCount}
          itemSize={30}
          width="100%"
          itemData={{
            filesAndIndentations,
          }}
        >
          {FileItemRows}
        </FixedSizeList>
      </div>
    </YStack>
  )
}

export default FileSidebar
