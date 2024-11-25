import React, { useState } from 'react'

import { ChatSidebar } from '../Chat/ChatSidebar'

import SearchComponent from './SearchComponent'
import { useChatContext } from '@/contexts/ChatContext'
import FileExplorer from './FileSideBar/FileExplorer'

export type SidebarAbleToShow = 'files' | 'search' | 'chats'

interface SidebarManagerProps {
  queryType: string
}

const SidebarManager: React.FC<SidebarManagerProps> = ({ queryType }) => {
  const { sidebarShowing } = useChatContext()

  return (
    <div className="size-full overflow-y-hidden">
      {sidebarShowing === 'files' && <FileExplorer />}

      {sidebarShowing === 'search' && (
        <SearchComponent
          queryType={queryType}
        />
      )}

      {sidebarShowing === 'chats' && <ChatSidebar />}
    </div>
  )
}

export default SidebarManager
