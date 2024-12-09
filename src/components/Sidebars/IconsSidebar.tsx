import React from 'react'

// import { CiSearch } from "react-icons/ci";
import { GrNewWindow } from 'react-icons/gr'
import { ImFilesEmpty } from 'react-icons/im'
import { IoSearch } from 'react-icons/io5'
import { RiChat3Line } from "react-icons/ri";
import { MdOutlineCreateNewFolder, MdSettings } from 'react-icons/md'
import { VscNewFolder } from 'react-icons/vsc'
import { HiOutlinePencilAlt } from 'react-icons/hi'
import { useTheme } from '@/contexts/ThemeContext'
import { FaMoon, FaSun } from 'react-icons/fa';

import { useModalOpeners } from '../../contexts/ModalContext'
import { useChatContext } from '@/contexts/ChatContext'
import { useContentContext } from '@/contexts/ContentContext'

export interface IconsSidebarProps {
  getShortcutDescription: (action: string) => string
}

const IconsSidebar: React.FC<IconsSidebarProps> = ({ getShortcutDescription }) => {
  const { sidebarShowing, setSidebarShowing } = useChatContext()
  const { theme, toggleTheme } = useTheme()

  const { isSettingsModalOpen, setIsSettingsModalOpen, setIsNewDirectoryModalOpen } = useModalOpeners()
  const { createUntitledNote } = useContentContext()

  return (
    <div className="flex size-full w-[55px] flex-col items-center justify-between bg-editor-four pt-2">
      <button
        className=" flex h-8 w-full cursor-pointer border-none bg-transparent"
        onClick={() => setSidebarShowing('files')}
      >
        <div className={`flex hover:bg-item-hover p-1 rounded-sm size-full items-center justify-center
            ${sidebarShowing === 'files' ? 'bg-item-hover' : ''}`}>
          <ImFilesEmpty
          className="text-gray-400"
            size={18}
            title={getShortcutDescription('open-files') || 'Open Files'}
          />
        </div>
      </button>
      <button
        className="flex h-8 w-full cursor-pointer border-none bg-transparent"
        onClick={() => setSidebarShowing('chats')}
      >
        <div className={`flex hover:bg-item-hover rounded-sm size-full items-center justify-center
            ${sidebarShowing === 'chats' ? 'bg-item-hover' : ''}`}>
          <RiChat3Line
            className='text-gray-400'
            size={20}
            title={getShortcutDescription('open-chat-bot') || 'Open Chatbot'}
          />
        </div>
      </button>
      <button
        className="flex w-full h-8 cursor-pointer border-none bg-transparent"
        onClick={() => setSidebarShowing('search')}
      >
        <div className={`flex hover:bg-item-hover p-1 rounded-sm size-full items-center justify-center
            ${sidebarShowing === 'search' ? 'bg-item-hover' : ''}`}>
          <IoSearch
            className='text-gray-400'
            size={22}
            title={getShortcutDescription('open-search') || 'Semantic Search'}
          />
        </div>
      </button>
      <button
        className="flex w-full h-8 cursor-pointer border-none bg-transparent"
        onClick={() => createUntitledNote()}
      >
        <div className="flex hover:bg-item-hover p-1 rounded-sm size-full items-center justify-center">
          <HiOutlinePencilAlt
              className="text-gray-400"
              size={22}
              title={getShortcutDescription('open-new-note') || 'New Note'}
            />
        </div>
      </button>
      <button
        className="mt-[2px] flex w-full h-8 cursor-pointer border-none bg-transparent"
        onClick={() => setIsNewDirectoryModalOpen(true)}
      >
        <div className="flex hover:bg-item-hover p-1 rounded-sm size-full items-center justify-center">
          <MdOutlineCreateNewFolder
            className="text-gray-400"
            size={21}
            title={getShortcutDescription('open-new-directory-modal') || 'New Directory'}
          />
        </div>
      </button>

      <div className="grow border-yellow-300" />
      <button
        className="gap-2 flex w-full cursor-pointer text-sm text-gray-700 dark:text-gray-300 bg-transparent"
        onClick={toggleTheme}
      >
        <div className="hover:bg-item-hover p-1 rounded-sm size-full text-gray-400">
          {theme === 'light' ? <FaSun /> : <FaMoon />}
        </div>
      </button>
      <button
        className="mb-[2px] flex w-full cursor-pointer items-center justify-center border-none bg-transparent"
        onClick={() => window.electronUtils.openNewWindow()}
        type="button"
      >
        <div className="hover:bg-item-hover p-1 rounded-sm size-full">
          <GrNewWindow className="text-gray-400" size={18} title="Open New Vault" />
        </div>
      </button>
      <button
        className="mb-3 flex w-full cursor-pointer items-center justify-center border-none bg-transparent"
        onClick={() => setIsSettingsModalOpen(!isSettingsModalOpen)}
        type="button"
        aria-label="Open Settings"
      >
        <div className="hover:bg-item-hover p-1 rounded-sm size-full">
          <MdSettings
            size={18}
            color="gray"
            className="text-generic-color"
            title={getShortcutDescription('open-settings-modal') || 'Settings'}
          />
        </div>
      </button>
    </div>
  )
}

export default IconsSidebar
