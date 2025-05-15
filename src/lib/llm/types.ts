import { CoreMessage } from 'ai'
import { FileInfoWithContent } from 'electron/main/filesystem/types'
import { DBEntry } from 'electron/main/vector-database/schema'

export type ReorChatMessage = CoreMessage & {
  context?: DBEntry[] | FileInfoWithContent[]
  hideMessage?: boolean
  visibleContent?: string
}

export type Chat = {
  [x: string]: any // used to delete legacy properties in store migrator.
  id: string
  messages: ReorChatMessage[]
  displayName: string
  timeOfLastMessage: number
}

export type ChatMetadata = Omit<Chat, 'messages'>

export interface DatabaseSearchFilters {
  limit: number
  minDate?: Date
  maxDate?: Date
  passFullNoteIntoContext?: boolean
}

export type PromptTemplate = {
  role: 'system' | 'user'
  content: string
}[]

export type LoadingState = 'idle' | 'generating' | 'waiting-for-first-token'

export type FileMetadata = {
  id: string // Unique identifier for the file
  fileName: string // Name of the file
  absolutePath: string // Absolute path to the file
  modifiedAt: string // Last modified date of the file
}
