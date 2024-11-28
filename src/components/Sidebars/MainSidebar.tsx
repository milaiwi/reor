import React, { useState } from 'react'

import { DBQueryResult } from 'electron/main/vector-database/schema'

import { ChatSidebar } from '../Chat/ChatSidebar'

import SearchComponent from './SearchComponent'
import { useChatContext } from '@/contexts/ChatContext'
import FileSidebar from './FileSideBar/FileSidebar'
import { useTheme } from '@/contexts/ThemeContext'
import { FaMoon, FaSun } from 'react-icons/fa';


export type SidebarAbleToShow = 'files' | 'search' | 'chats'

const SidebarManager: React.FC = () => {
  const { sidebarShowing } = useChatContext()

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<DBQueryResult[]>([])
  const { theme, toggleTheme } = useTheme()
  
  return (
    <div className="size-full overflow-y-hidden flex flex-col flex-end">
      {sidebarShowing === 'files' && <FileSidebar />}

      {sidebarShowing === 'search' && (
        <SearchComponent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
        />
      )}

      {sidebarShowing === 'chats' && <ChatSidebar />}
      
      {/* Theme toggle button */}
      <button
        className="flex items-center gap-2 p-2 m-4 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
        onClick={toggleTheme}
      >
        {theme === 'light' ? <FaSun className="text-lg" /> : <FaMoon className="text-lg" />}
        <span>{theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
      </button>
    </div>
  )
}

export default SidebarManager
