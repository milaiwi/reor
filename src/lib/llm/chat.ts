/* eslint-disable no-param-reassign */
import posthog from 'posthog-js'
import { Chat, ReorChatMessage } from './types'
import { generateChatName } from '@shared/utils'

export const appendStringContentToMessages = (messages: ReorChatMessage[], content: string): ReorChatMessage[] => {
  if (content === '') {
    return messages
  }

  if (messages.length === 0) {
    return [
      {
        role: 'assistant',
        content,
      },
    ]
  }

  const lastMessage = messages[messages.length - 1]

  if (lastMessage.role === 'assistant') {
    return [
      ...messages.slice(0, -1),
      {
        ...lastMessage,
        content:
          typeof lastMessage.content === 'string'
            ? lastMessage.content + content
            : [...lastMessage.content, { type: 'text' as const, text: content }],
      },
    ]
  }

  return [
    ...messages,
    {
      role: 'assistant',
      content,
    },
  ]
}

export const convertMessageToString = (message: ReorChatMessage | undefined): string => {
  if (!message) {
    return ''
  }
  if (message.visibleContent) {
    return message.visibleContent
  }
  if (typeof message.content === 'string') {
    return message.content
  }
  return ''
}

export const generateInitialChat = async (userTextFieldInput: string): Promise<Chat> => {
  const messages: ReorChatMessage[] = [
    {
      role: 'user',
      visibleContent: userTextFieldInput,
      content: userTextFieldInput,
    },
  ]

  return {
    id: Date.now().toString(),
    messages,
    displayName: generateChatName(messages, userTextFieldInput),
    timeOfLastMessage: Date.now(),
  }
}

export const generateFollowUpChat = async (
  currentChat: Chat | undefined,
  userTextFieldInput: string,
): Promise<Chat> => {
  if (!currentChat) {
    throw new Error('Current chat is required')
  }
  
  currentChat.messages.push({
    role: 'user',
    visibleContent: userTextFieldInput,
    content: userTextFieldInput,
  })

  return currentChat
}

export const appendToOrCreateChat = async (
  currentChat: Chat | undefined,
  userTextFieldInput: string,
): Promise<Chat> => {
  let outputChat = currentChat

  if (!outputChat || !outputChat.id || outputChat.messages.length === 0) {
    outputChat = await generateInitialChat(userTextFieldInput ?? '')
    posthog.capture('chat_message_submitted', {
      chatId: outputChat?.id,
      chatLength: outputChat?.messages.length,
    })
  } else {
    outputChat = await generateFollowUpChat(outputChat, userTextFieldInput)
    posthog.capture('follow_up_chat_message_submitted', {
      chatId: outputChat?.id,
      chatLength: outputChat?.messages.length,
    })
  }

  return outputChat
}

export const getDisplayMessage = (message: ReorChatMessage): string | undefined => {
  if (message.hideMessage) {
    return undefined
  }
  if (message.visibleContent !== null && message.visibleContent !== undefined && message.visibleContent !== '') {
    return message.visibleContent
  }
  if (typeof message.content === 'string') {
    return message.content
  }
  return undefined
}
