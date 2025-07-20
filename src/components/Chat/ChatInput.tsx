import React, { useState, useRef, useEffect } from 'react'
import { Button } from '@material-tailwind/react'
import { Send } from 'lucide-react'
import { useChatContext } from '@/contexts/ChatContext'
import { useContentContext } from '@/contexts/ContentContext'
import useLLMConfigs from '@/lib/hooks/use-llm-configs'
import useAgentConfig from '@/lib/hooks/use-agent-configs'

interface ChatInputProps {
  userTextFieldInput: string
  setUserTextFieldInput: (input: string) => void
  handleSubmitNewMessage: () => void
  loadingState: string
  selectedLLM: string | undefined
  setSelectedLLM: (llm: string) => void
  agentConfig: any
  setAgentConfig: (config: any) => void
}

const ChatInput: React.FC<ChatInputProps> = ({
  userTextFieldInput,
  setUserTextFieldInput,
  handleSubmitNewMessage,
  loadingState,
  selectedLLM,
  setSelectedLLM,
  agentConfig,
  setAgentConfig,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { llmConfigs } = useLLMConfigs()
  const { agentConfig: currentAgentConfig } = useAgentConfig()

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [userTextFieldInput])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitNewMessage()
    }
  }

  const handleSubmit = () => {
    if (userTextFieldInput.trim() && loadingState !== 'waiting-for-first-token') {
      handleSubmitNewMessage()
    }
  }

  return (
    <div className="flex items-end gap-2 p-4">
      <div className="flex-1">
        <textarea
          ref={textareaRef}
          value={userTextFieldInput}
          onChange={(e) => setUserTextFieldInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="w-full resize-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder-gray-400 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          rows={1}
          disabled={loadingState === 'waiting-for-first-token'}
        />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!userTextFieldInput.trim() || loadingState === 'waiting-for-first-token'}
        className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-500 p-0 text-white hover:bg-blue-600 disabled:bg-gray-400"
      >
        <Send size={16} />
      </Button>
    </div>
  )
}

export default ChatInput
