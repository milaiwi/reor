import React, { useCallback, useEffect, useState, useRef } from 'react'
import { streamText } from 'ai'
import { toast } from 'react-toastify'
import { appendStringContentToMessages, appendToOrCreateChat } from '../../lib/llm/chat'
import '../../styles/chat.css'
import ChatMessages from './ChatMessages'
import { Chat, LoadingState } from '../../lib/llm/types'
import { useChatContext } from '@/contexts/ChatContext'
import resolveLLMClient from '@/lib/llm/client'

const ChatComponent: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle')
  const containerRef = useRef<HTMLDivElement>(null)
  const { currentChat, setCurrentChat, saveChat } = useChatContext()
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const fetchChat = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      setLoadingState('idle')
    }
    fetchChat()
  }, [currentChat?.id, saveChat])

  const handleNewChatMessage = useCallback(
    async (chat: Chat | undefined, llmName: string, userTextFieldInput?: string) => {
      let outputChat: Chat | undefined
      try {
        if (!userTextFieldInput?.trim() && (!chat || chat.messages.length === 0)) {
          return
        }

        outputChat = userTextFieldInput?.trim()
          ? await appendToOrCreateChat(chat, userTextFieldInput)
          : chat

        if (!outputChat) {
          return
        }

        setCurrentChat(outputChat)
        await saveChat(outputChat)

        const llmClient = await resolveLLMClient(llmName)
        abortControllerRef.current = new AbortController()
        setLoadingState('waiting-for-first-token')
        const { textStream } = await streamText({
          model: llmClient,
          messages: outputChat.messages,
          abortSignal: abortControllerRef.current.signal,
        })

        for await (const text of textStream) {
          if (abortControllerRef.current.signal.aborted) {
            return
          }

          outputChat = {
            ...outputChat,
            messages: appendStringContentToMessages(outputChat.messages || [], text),
          }
          setCurrentChat(outputChat)
          setLoadingState('generating')
        }

        setLoadingState('idle')
      } catch (error) {
        setLoadingState('idle')
        throw error
      } finally {
        abortControllerRef.current = null
      }
    },
    [saveChat, setCurrentChat],
  )

  return (
    <div className="chat-container" ref={containerRef}>
      <ChatMessages
        currentChat={currentChat}
        loadingState={loadingState}
        handleNewChatMessage={(llmName: string, userTextFieldInput?: string) =>
          handleNewChatMessage(currentChat, llmName, userTextFieldInput)
        }
      />
    </div>
  )
}

export default ChatComponent
