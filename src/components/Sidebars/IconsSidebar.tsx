import React from 'react'

import { CiSearch } from "react-icons/ci";
import { GrNewWindow } from 'react-icons/gr'
import { ImFilesEmpty } from 'react-icons/im'
import { IoChatbubbleEllipsesOutline } from 'react-icons/io5'
import { MdSettings } from 'react-icons/md'
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
    <div className="flex size-full w-[55px] flex-col items-center justify-between gap-1 bg-editor-four pt-2">
      <div
        className=" flex h-8 w-full cursor-pointer items-center justify-center"
        onClick={() => setSidebarShowing('files')}
      >
        <span className="flex size-4/5 items-center justify-center rounded">
          <ImFilesEmpty
            className={`cursor-pointer mx-auto text-generic-color ${
              sidebarShowing === 'files' ? '' : 'text-gray-400 hover:text-gray-color'
            }`}
            size={18}
            title={getShortcutDescription('open-files') || 'Open Files'}
          />
        </span>
      </div>
      <div
        className="flex h-8 w-full cursor-pointer items-center justify-center"
        onClick={() => setSidebarShowing('chats')}
      >
        <span className="flex size-4/5 items-center justify-center rounded">
          <IoChatbubbleEllipsesOutline
            className={`cursor-pointer text-generic-color ${
              sidebarShowing === 'chats' ? '' : 'text-gray-400 hover:text-gray-color'
            }`}
            size={18}
            title={getShortcutDescription('open-chat-bot') || 'Open Chatbot'}
          />
        </span>
      </div>
      <div
        className="flex h-8 w-full cursor-pointer items-center justify-center"
        onClick={() => setSidebarShowing('search')}
      >
        <span className="flex size-4/5 items-center justify-center rounded">
          <CiSearch
            className={`cursor-pointer text-generic-color ${
              sidebarShowing === 'search' ? '' : 'text-gray-400 hover:text-gray-color'
            }`}
            size={22}
            title={getShortcutDescription('open-search') || 'Semantic Search'}
          />
        </span>
      </div>
      <div
        className="flex h-8 w-full cursor-pointer items-center justify-center border-none bg-transparent "
        onClick={() => createUntitledNote()}
      >
        <span className="flex size-4/5 items-center justify-center rounded">
          <HiOutlinePencilAlt
              className="text-lgray-color hover:text-gray-color"
              size={22}
              title={getShortcutDescription('open-new-note') || 'New Note'}
            />
        </span>
      </div>
      <div
        className="mt-[2px] flex h-8 w-full cursor-pointer items-center justify-center border-none bg-transparent "
        onClick={() => setIsNewDirectoryModalOpen(true)}
      >
        <div className="flex size-4/5 items-center justify-center rounded">
          <VscNewFolder
            className="text-lgray-color hover:text-gray-color"
            size={18}
            title={getShortcutDescription('open-new-directory-modal') || 'New Directory'}
          />
        </div>
      </div>

      <div className="grow border-yellow-300" />
      <button
        className="gap-2 pb-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-transparent cursor-pointer"
        onClick={toggleTheme}
      >
        {theme === 'light' ? <FaSun /> : <FaMoon />}
      </button>
      <div
        className="mb-[2px] flex w-full cursor-pointer items-center justify-center border-none bg-transparent pb-2"
        onClick={() => window.electronUtils.openNewWindow()}
      >
        <GrNewWindow className="text-gray-100" color="gray" size={18} title="Open New Vault" />
      </div>

      <button
        className="flex w-full cursor-pointer items-center justify-center border-none bg-transparent pb-2"
        onClick={() => setIsSettingsModalOpen(!isSettingsModalOpen)}
        type="button"
        aria-label="Open Settings"
      >
        <MdSettings
          color="gray"
          size={18}
          className="mb-3 size-6 text-generic-color"
          title={getShortcutDescription('open-settings-modal') || 'Settings'}
        />
      </button>
    </div>
  )
}

export default IconsSidebar
