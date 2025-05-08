import Store from 'electron-store'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'

import { StoreKeys, StoreSchema } from '../electron-store/storeConfig'
import { Block } from './blockTypes'

// Chunk by markdown headings and then use Langchain chunker if the heading chunk is too big:
const store = new Store<StoreSchema>()

const chunkSize = store.get(StoreKeys.ChunkSize)

interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote'
  content: string
  level?: number
  index?: number
  headingContext?: string
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split('\n')
  const blocks: MarkdownBlock[] = []
  let currentBlock: MarkdownBlock | null = null
  let currentContent: string[] = []
  let currentHeading: string | undefined = undefined

  function flushCurrentBlock() {
    if (currentBlock && currentContent.length > 0) {
      currentBlock.content = currentContent.join('\n')
      if (currentHeading && currentBlock.type !== 'heading') {
        currentBlock.headingContext = currentHeading
      }
      blocks.push(currentBlock)
      currentContent = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (line.startsWith('#')) {
      flushCurrentBlock()
      const level = line.match(/^#+/)?.[0].length || 1
      currentHeading = line
      currentBlock = {
        type: 'heading',
        level,
        content: line.replace(/^#+\s*/, ''),
        index: i,
      }
      currentContent = [currentBlock.content]
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushCurrentBlock()
      currentBlock = {
        type: 'list',
        content: line,
        index: i,
        headingContext: currentHeading,
      }
      currentContent = [line]
    } else if (line.startsWith('```')) {
      flushCurrentBlock()
      currentBlock = {
        type: 'code',
        content: line,
        index: i,
        headingContext: currentHeading,
      }
      currentContent = [line]
    } else if (line.trim() === '') {
      flushCurrentBlock()
      currentBlock = null
    } else {
      if (!currentBlock) {
        currentBlock = {
          type: 'paragraph',
          content: '',
          index: i,
          headingContext: currentHeading,
        }
      }
      currentContent.push(line)
    }
  }

  flushCurrentBlock()
  return blocks
}

function chunkContentWithHeadingContext(blocks: MarkdownBlock[]): MarkdownBlock[] {
  const chunks: MarkdownBlock[] = []
  let currentChunk: MarkdownBlock[] = []
  let currentHeading: string | undefined = undefined
  let currentChunkSize = 0

  function splitContentIntoChunks(content: string, headingContext: string | undefined): MarkdownBlock[] {
    const contentChunks: MarkdownBlock[] = []
    let remainingContent = content
    let startIndex = 0

    while (remainingContent.length > 0) {
      // If remaining content is less than chunk size, add it all
      if (remainingContent.length <= chunkSize) {
        contentChunks.push({
          type: 'paragraph',
          content: remainingContent,
          index: startIndex,
          headingContext,
        })
        break
      }

      // Find the last space before chunk size to avoid cutting words
      const lastSpaceIndex = remainingContent.lastIndexOf(' ', chunkSize)
      const splitIndex = lastSpaceIndex === -1 ? chunkSize : lastSpaceIndex

      // Add the chunk
      contentChunks.push({
        type: 'paragraph',
        content: remainingContent.slice(0, splitIndex),
        index: startIndex,
        headingContext,
      })

      // Update remaining content and start index
      remainingContent = remainingContent.slice(splitIndex + 1)
      startIndex += splitIndex + 1
    }

    return contentChunks
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      // If we have content in the current chunk, save it
      if (currentChunk.length > 0) {
        chunks.push({
          type: 'paragraph',
          content: currentChunk.map(b => b.content).join('\n\n'),
          index: currentChunk[0].index,
          headingContext: currentHeading,
        })
        currentChunk = []
        currentChunkSize = 0
      }
      currentHeading = `# ${block.content}`
      currentChunk = [block]
      currentChunkSize = block.content.length
    } else {
      const blockSize = block.content.length

      // If adding this block would exceed chunk size, split it into smaller chunks
      if (currentChunkSize + blockSize > chunkSize) {
        // Split the current block into smaller chunks
        const splitChunks = splitContentIntoChunks(block.content, currentHeading)
        chunks.push(...splitChunks)
      } else {
        currentChunk.push(block)
        currentChunkSize += blockSize
      }
    }
  }

  // Add any remaining content
  if (currentChunk.length > 0) {
    chunks.push({
      type: 'paragraph',
      content: currentChunk.map(b => b.content).join('\n\n'),
      index: currentChunk[0].index,
      headingContext: currentHeading,
    })
  }

  return chunks
}

export function chunkMarkdownByHeadings(markdownContent: string): MarkdownBlock[] {
  const blocks = parseMarkdownBlocks(markdownContent)
  return chunkContentWithHeadingContext(blocks)
}

export const chunkMarkdownByBlocksAndByCharsIfBig = async (
  markdownContent: string,
): Promise<MarkdownBlock[]> => {
  return chunkMarkdownByHeadings(markdownContent)
}
