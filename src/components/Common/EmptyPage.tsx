import React from 'react'
import { useContentContext } from '@/contexts/ContentContext'
import { useModalOpeners } from '@/contexts/ModalContext'
import { File } from 'lucide-react'

const EmptyPage: React.FC = () => {
  const { setIsNewDirectoryModalOpen } = useModalOpeners()
  const { createUntitledNote } = useContentContext()

  return (
    <div className="flex size-full flex-col items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="mb-2 opacity-10">
          <File size={168} color="$brand3" />
        </div>
        <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
          No File Selected!
        </p>
        <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
          Open a file and get back to work!
        </p>
        <div className='mt-4'>
          <button
            className="cursor-pointer border-0 bg-transparent pb-1 pr-0 text-left text-2lg text-blue-500"
            onClick={() => createUntitledNote()}
            type="button"
          >
            Create a File
          </button>
          <button
            className="cursor-pointer border-0 bg-transparent pb-1 pr-0 text-left text-2lg text-blue-500"
            onClick={() => setIsNewDirectoryModalOpen(true)}
            type="button"
          >
            Create a Folder
          </button>
        </div>
      </div>
    </div>
  )
}

export default EmptyPage
