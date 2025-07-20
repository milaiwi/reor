import React from 'react'
import { ToolCallPart } from 'ai'
import { Chat } from '@/lib/llm/types'

interface ToolCallsProps {
  toolCalls: ToolCallPart[]
  setCurrentChat: React.Dispatch<React.SetStateAction<Chat | undefined>>
  currentChat: Chat | undefined
}

const ToolCalls: React.FC<ToolCallsProps> = ({ toolCalls, setCurrentChat, currentChat }) => {
  return (
    <div className="mt-2 space-y-2">
      {toolCalls.map((toolCall) => (
        <div key={toolCall.toolCallId} className="rounded-md bg-gray-200 p-2 dark:bg-gray-700">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Tool: {toolCall.toolName}
          </p>
          <p className="text-xs text-gray-800 dark:text-gray-200">
            {JSON.stringify(toolCall.args, null, 2)}
          </p>
        </div>
      ))}
    </div>
  )
}

export default ToolCalls
