import React, { useEffect, useRef, useState } from 'react'

import { ChatHistoryMetadata } from './hooks/use-chat-history'
import { ChatHistory } from './chatUtils'
import { LuPanelLeftClose } from "react-icons/lu";
import { RiChatNewFill } from "react-icons/ri";

export interface ChatItemProps {
  chatMetadata: ChatHistoryMetadata
  selectedChatID: string | null
  onChatSelect: (path: string) => void
  // currentSelectedChatID: React.MutableRefObject<string | undefined>
}

export const ChatItem: React.FC<ChatItemProps> = ({
  chatMetadata,
  selectedChatID,
  onChatSelect,
  // currentSelectedChatID,
}) => {
  const isSelected = chatMetadata.id === selectedChatID

  const itemClasses = `flex items-center cursor-pointer px-2 py-1 border-b border-gray-200 hover:bg-neutral-700 h-full mt-0 mb-0 ${
    isSelected ? 'bg-neutral-700 text-white font-semibold' : 'text-gray-200'
  }`

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    window.electronUtils.showChatItemContext(chatMetadata)
  }

  return (
    <div>
      <div
        onClick={() => {
          onChatSelect(chatMetadata.id)
          // currentSelectedChatID.current = chatMetadata.id
        }}
        className={itemClasses}
        onContextMenu={handleContextMenu}
      >
        <span className="mt-0 flex-1 truncate text-[13px]">{chatMetadata.displayName}</span>
      </div>
    </div>
  )
}

interface ChatListProps {
  chatHistoriesMetadata: ChatHistoryMetadata[]
  currentChatHistory: ChatHistory | undefined
  onSelect: (chatID: string) => void
  newChat: () => void
  setShowChatbot: (showChat: boolean) => void
  isSidebarOpen: boolean
  setIsSidebarOpen: (showSidebar: boolean) => void
}

export const ChatsSidebar: React.FC<ChatListProps> = ({
  chatHistoriesMetadata,
  currentChatHistory,
  onSelect,
  newChat,
  setShowChatbot,
  isSidebarOpen,
  setIsSidebarOpen
}) => {
  const currentSelectedChatID = useRef<string | undefined>()
  // const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  useEffect(() => {}, [chatHistoriesMetadata])
  useEffect(() => {
    const deleteChatRow = window.ipcRenderer.receive('remove-chat-at-id', (chatID) => {
      // const filteredData = chatHistoriesMetadata.filter(
      //   (item) => item.id !== chatID
      // );
      // setChatHistoriesMetadata(filteredData.reverse());
      if (chatID === currentSelectedChatID.current) {
        setShowChatbot(false)
      }
      window.electronStore.removeChatHistoryAtID(chatID)
    })

    return () => {
      deleteChatRow()
    }
  }, [chatHistoriesMetadata, setShowChatbot])

  const handleToggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="h-full overflow-y-auto bg-neutral-800">
      <div
        className="m-1 flex justify-between rounded border border-transparent px-2 py-[8px] text-white transition duration-150 ease-in-out hover:border-white"
        // onClick={newChat}
      >
        {/* <span className="text-sm"> + New Chat</span> */}
        <LuPanelLeftClose 
          onClick={handleToggleSidebar}
          className="cursor-pointer"
          size={22}
        />
        <RiChatNewFill 
          className="cursor-pointer"
          onClick={newChat}
          size={22} 
        />
      </div>

      {isSidebarOpen && chatHistoriesMetadata
        .slice()
        .reverse()
        .map((chatMetadata) => (
          <ChatItem
            key={chatMetadata.id}
            // chat={chat}
            chatMetadata={chatMetadata}
            selectedChatID={currentChatHistory?.id || ''}
            onChatSelect={onSelect}
            // currentSelectedChatID={currentSelectedChatID}
          />
        ))}
    </div>
  )
}
