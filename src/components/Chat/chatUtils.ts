import { DBEntry, DBQueryResult } from 'electron/main/vector-database/schema'
import { ChatCompletionContentPart, ChatCompletionMessageParam } from 'openai/resources/chat/completions'

export type ChatMessageToDisplay = ChatCompletionMessageParam & {
  messageType: 'success' | 'error'
  context: DBEntry[]
  visibleContent?: string
  messageCreated?: string
}

export type ChatHistory = {
  id: string
  displayableChatHistory: ChatMessageToDisplay[]
  historyCreated?: string
}

export interface ChatFilters {
  numberOfChunksToFetch: number
  files: string[]
  minDate?: Date
  maxDate?: Date
}

export function formatOpenAIMessageContentIntoString(
  content: string | ChatCompletionContentPart[] | null | undefined,
): string | undefined {
  if (Array.isArray(content)) {
    return content.reduce((acc, part) => {
      if (part.type === 'text') {
        return acc + part.text // Concatenate text parts
      }
      return acc // Skip image parts
    }, '')
  }
  return content || undefined
}

interface ChatProperties {
  [key: string]: string // Values must be strings
}

export type ChatTemplate = {
  messageHistory: ChatCompletionMessageParam[]
  properties: ChatProperties
}

// function replaceContentInMessages(
//   messages: ChatMessageToDisplay[],
//   context: ChatProperties
// ): ChatMessageToDisplay[] {
//   return messages.map((message) => {
//     if ("content" in message) {
//       if (typeof message.content === "string") {
//         message.content = message.content.replace(
//           /\{(\w+)\}/g,
//           (match, key) => {
//             return key in context ? context[key] : match;
//           }
//         );
//       }
//     }
//     return message;
//   });
// }

// const ragPromptTemplate: ChatCompletionMessageParam[] = [
//   {
//     content:
//       "You are an advanced question answer agent answering questions based on provided context.",
//     role: "system",
//   },
//   {
//     content: `
// Context:
// {context}

// Query:
// {query}`,
//     role: "user",
//   },
// ];

export const generateTimeStampFilter = (minDate?: Date, maxDate?: Date): string => {
  let filter = ''

  if (minDate) {
    const minDateStr = minDate.toISOString().slice(0, 19).replace('T', ' ')
    filter += `filemodified > timestamp '${minDateStr}'`
  }

  if (maxDate) {
    const maxDateStr = maxDate.toISOString().slice(0, 19).replace('T', ' ')
    if (filter) {
      filter += ' AND '
    }
    filter += `filemodified < timestamp '${maxDateStr}'`
  }

  return filter
}

export const resolveRAGContext = async (query: string, chatFilters: ChatFilters): Promise<ChatMessageToDisplay> => {
  let results: DBEntry[] = []
  if (chatFilters.files.length > 0) {
    results = await window.fileSystem.getFilesystemPathsAsDBItems(chatFilters.files)
  } else if (chatFilters.numberOfChunksToFetch > 0) {
    const timeStampFilter = generateTimeStampFilter(chatFilters.minDate, chatFilters.maxDate)
    results = await window.database.search(query, chatFilters.numberOfChunksToFetch, timeStampFilter)
  }
  return {
    messageType: 'success',
    role: 'user',
    context: results,
    content: `Based on the following context answer the question down below. \n\n\nContext: \n${results
      .map((dbItem) => dbItem.content)
      .join('\n\n')}\n\n\nQuery:\n${query}`,
    visibleContent: query,
  }
}

export const getChatHistoryContext = (chatHistory: ChatHistory | undefined): DBQueryResult[] => {
  if (!chatHistory) return []
  const contextForChat = chatHistory.displayableChatHistory.map((message) => message.context).flat()
  return contextForChat as DBQueryResult[]
}

export const getDisplayableChatName = (chat: ChatHistory): string => {
  const actualHistory = chat.displayableChatHistory

  if (actualHistory.length === 0 || !actualHistory[actualHistory.length - 1].content) {
    return 'Empty Chat'
  }

  const lastMsg = actualHistory[0]

  if (lastMsg.visibleContent) {
    return lastMsg.visibleContent.slice(0, 30)
  }

  const lastMessage = formatOpenAIMessageContentIntoString(lastMsg.content)
  if (!lastMessage || lastMessage === '') {
    return 'Empty Chat'
  }
  return lastMessage.slice(0, 30)
}
