import React from 'react'
import { FaRegCopy } from 'react-icons/fa'
import { ReorChatMessage } from '../../../lib/llm/types'
import MarkdownRenderer from '@/components/Common/MarkdownRenderer'

interface AssistantMessageProps {
  message: ReorChatMessage
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ message }) => {
  const handleCopy = () => {
    if (typeof message.content === 'string') {
      navigator.clipboard.writeText(message.content)
    }
  }

  return (
    <div className="assistant-message">
      <div className="message-content">
        {typeof message.content === 'string' ? (
          <MarkdownRenderer content={message.content} />
        ) : (
          message.content.map((part, index) => {
            if (part.type === 'text') {
              return <MarkdownRenderer key={index} content={part.text} />
            }
            return null
          })
        )}
      </div>
      {typeof message.content === 'string' && (
        <button className="copy-button" onClick={handleCopy}>
          <FaRegCopy />
        </button>
      )}
    </div>
  )
}

export default AssistantMessage
