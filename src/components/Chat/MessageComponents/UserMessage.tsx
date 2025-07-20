import React from 'react'
import { ReorChatMessage } from '@/lib/llm/types'
import MarkdownRenderer from '@/components/Common/MarkdownRenderer'

interface UserMessageProps {
  message: ReorChatMessage
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-lg bg-blue-500 p-3 text-white">
        <div className="text-sm">
          <MarkdownRenderer content={message.content as string} />
        </div>
      </div>
    </div>
  )
}

export default UserMessage
