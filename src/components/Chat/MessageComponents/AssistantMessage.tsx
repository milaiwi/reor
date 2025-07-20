import React from 'react'
import { ReorChatMessage, Chat } from '@/lib/llm/types'
import MarkdownRenderer from '@/components/Common/MarkdownRenderer'

interface AssistantMessageProps {
  message: ReorChatMessage
  setCurrentChat: React.Dispatch<React.SetStateAction<Chat | undefined>>
  currentChat: Chat | undefined
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ message, setCurrentChat, currentChat }) => {
  return (
    <div className="flex justify-start">
      <div className="max-w-[80%] rounded-lg bg-gray-100 p-3 dark:bg-gray-800">
        <div className="text-sm text-gray-900 dark:text-gray-100">
          <MarkdownRenderer content={message.content as string} />
        </div>
      </div>
    </div>
  )
}

export default AssistantMessage
