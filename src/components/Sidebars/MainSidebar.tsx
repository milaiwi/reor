import React, { useState } from 'react'

import { DBQueryResult } from 'electron/main/vector-database/schema'

import { ChatsSidebar } from '../Chat/ChatsSidebar'

import SearchComponent from './FileSidebarSearch'
import FileSidebar from './FileSideBar'
import { useChatContext } from '@/contexts/ChatContext'
import { ContextMenuLocations, ContextMenuFocus } from '../Menu/CustomContextMenu'

export type SidebarAbleToShow = 'files' | 'search' | 'chats'

interface SidebarManagerProps {
  handleFocusedItem: (
    event: React.MouseEvent<HTMLDivElement>,
    focusedItem: ContextMenuLocations,
    additionalData?: Partial<Omit<ContextMenuFocus, 'currentSelection' | 'locations'>>,
  ) => void
}

const SidebarManager: React.FC<SidebarManagerProps> = ({ handleFocusedItem }) => {
  const { sidebarShowing } = useChatContext()
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<DBQueryResult[]>([])

  return (
    <div className="size-full overflow-y-hidden">
      {sidebarShowing === 'files' && <FileSidebar />}
      {sidebarShowing === 'search' && (
        <SearchComponent
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchResults={searchResults}
          setSearchResults={setSearchResults}
        />
      )}

      {sidebarShowing === 'chats' && <ChatsSidebar />}
    </div>
  )
}

export default SidebarManager