import React from 'react'
import { FileInfoWithContent } from 'electron/main/filesystem/types'
import { DBEntry } from 'electron/main/vector-database/schema'
import posthog from 'posthog-js'
import { useContentContext } from '@/contexts/ContentContext'
import Tooltip from '@/components/Editor/ui/src/tooltip'
import MarkdownRenderer from '@/components/Common/MarkdownRenderer'
import { useThemeManager } from '@/contexts/ThemeContext'

interface ChatSourcesProps {
  contextItems: FileInfoWithContent[] | DBEntry[]
}

export const truncateName = (name: string, maxLength: number) => {
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 3)}...`
}

const ChatSources: React.FC<ChatSourcesProps> = ({ contextItems }) => {
  const { state } = useThemeManager()
  const { openContent } = useContentContext()

  const isDBEntry = (item: FileInfoWithContent | DBEntry): item is DBEntry => {
    return 'notepath' in item
  }

  const getItemName = (item: FileInfoWithContent | DBEntry) => {
    if (isDBEntry(item)) {
      return item.notepath.split('/').pop() || ''
    }
    return item.name
  }

  const getItemPath = (item: FileInfoWithContent | DBEntry) => {
    return isDBEntry(item) ? item.notepath : item.path
  }

  const getItemContent = (item: FileInfoWithContent | DBEntry) => {
    return item.content
  }

  const handleOpenContent = (path: string) => {
    openContent(path)
    posthog.capture('open_content_from_chat_sources')
  }

  if (contextItems.length === 0) {
    return null
  }

  return (
    <div>
      <div className="mb-1 text-sm text-muted-foreground">Sources:</div>

      <div
        className={`flex space-x-2 overflow-x-auto p-0 pb-1 scrollbar-thin scrollbar-track-transparent 
          ${state === 'light' ? 'scrollbar-thumb-gray-200' : 'scrollbar-thumb-gray-700'}`}
      >
        {contextItems.map((contextItem) => (
          <div key={getItemPath(contextItem)}>
            <Tooltip content={getItemContent(contextItem)} renderMarkdown placement="top">
              <div
                className="cursor-pointer overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                onClick={() => handleOpenContent(getItemPath(contextItem))}
              >
                <div className="max-h-[100px] overflow-y-auto">
                  <MarkdownRenderer content={truncateName(getItemName(contextItem), 20)} />
                </div>
              </div>
            </Tooltip>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ChatSources
