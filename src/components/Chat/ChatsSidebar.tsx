import React, { useEffect, useRef } from 'react'

import { ChatHistoryMetadata } from './hooks/use-chat-history'
import { ChatHistory } from './chatUtils'
import { FaPlus } from "react-icons/fa6";

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

  const itemClasses = `flex items-center cursor-pointer px-2 py-2 border-b border-gray-200 hover:bg-neutral-700 h-full mt-0 mb-1 bg-neutral-700 text-white rounded-md`

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
        <span className="mt-0 mb-1 flex-1 truncate text-[13px]">{chatMetadata.displayName}</span>
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
  setIsSidebarOpen,
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
    <div className="relative h-full flex flex-col overflow-y-auto bg-neutral-800 p-2 opacity-80">
      <div
        className="m-1 mb-3 text-white text-[12px] font-bold"
      >
        Chats
      </div>

      <div className="flex-grow">
        {isSidebarOpen &&
          chatHistoriesMetadata
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

      <div 
        className="flex justify-between items-center px-2 py-1 mb-3 bg-lime text-[12px] cursor-pointer rounded-md"
        onClick={newChat}
      >  
        <span className="text-black">New chat</span>
        <div className="p-2 bg-white rounded-md">
          <FaPlus className="text-black" />
        </div>
      </div>
    </div>
  )
}
