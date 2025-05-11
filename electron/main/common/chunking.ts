import Store from 'electron-store'

import { StoreKeys, StoreSchema } from '../electron-store/storeConfig'

// Chunk by markdown headings and then use Langchain chunker if the heading chunk is too big:
const store = new Store<StoreSchema>()

const chunkSize = store.get(StoreKeys.ChunkSize)

interface MarkdownBlock {
  type: 'heading' | 'paragraph' | 'list' | 'code' | 'quote'
  content: string
  level?: number
  startingPos?: number
  headingContext?: string
}

function parseMarkdownBlocks(markdown: string): MarkdownBlock[] {
  const lines = markdown.split('\n')
  const blocks: MarkdownBlock[] = []
  let currentBlock: MarkdownBlock | null = null
  let currentContent: string[] = []
  let currentHeading: string | undefined
  let currentPosition = 0 // Track current position in the document

  function flushCurrentBlock() {
    if (currentBlock && currentContent.length > 0) {
      currentBlock.content = currentContent.join('\n')
      if (currentHeading && currentBlock.type !== 'heading') {
        currentBlock.headingContext = currentHeading
      }
      currentBlock.startingPos = currentPosition - currentBlock.content.length // Set starting position
      blocks.push(currentBlock)
      currentContent = []
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    currentPosition += line.length + 1 // Add 1 for the newline character

    if (line.startsWith('#')) {
      flushCurrentBlock()
      const level = line.match(/^#+/)?.[0].length || 1
      currentHeading = line
      currentBlock = {
        type: 'heading',
        level,
        content: line.replace(/^#+\s*/, ''),
        startingPos: currentPosition - line.length, // Set starting position for heading
      }
      currentContent = [currentBlock.content]
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      flushCurrentBlock()
      currentBlock = {
        type: 'list',
        content: line,
        headingContext: currentHeading,
        startingPos: currentPosition - line.length, // Set starting position for list
      }
      currentContent = [line]
    } else if (line.startsWith('```')) {
      flushCurrentBlock()
      currentBlock = {
        type: 'code',
        content: line,
        headingContext: currentHeading,
        startingPos: currentPosition - line.length, // Set starting position for code
      }
      currentContent = [line]
    } else if (line.trim() === '') {
      flushCurrentBlock()
      // TODO: Potentially increment index of current block
      currentBlock = null
    } else {
      if (!currentBlock) {
        currentBlock = {
          type: 'paragraph',
          content: '',
          headingContext: currentHeading,
          startingPos: currentPosition - line.length, // Set starting position for paragraph
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
  let currentHeading: string | undefined
  let currentChunkSize = 0
  let currentStartingPos = 0

  function splitContentIntoChunks(
    content: string,
    headingContext: string | undefined,
    startingPos: number,
  ): MarkdownBlock[] {
    const contentChunks: MarkdownBlock[] = []
    let remainingContent = content
    let currentPos = startingPos

    while (remainingContent.length > 0) {
      // If remaining content is less than chunk size, add it all
      if (remainingContent.length <= chunkSize) {
        contentChunks.push({
          type: 'paragraph',
          content: remainingContent,
          headingContext,
          startingPos: currentPos,
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
        headingContext,
        startingPos: currentPos,
      })

      // Update remaining content and position
      remainingContent = remainingContent.slice(splitIndex + 1)
      currentPos += splitIndex + 1 // Add 1 for the space character
    }

    return contentChunks
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      // If we have content in the current chunk, save it
      if (currentChunk.length > 0) {
        chunks.push({
          type: 'paragraph',
          content: currentChunk.map((b) => b.content).join('\n\n'),
          headingContext: currentHeading,
          startingPos: currentStartingPos,
        })
        currentChunk = []
        currentChunkSize = 0
      }
      currentHeading = `# ${block.content}`
      currentChunk = [block]
      currentChunkSize = block.content.length
      currentStartingPos = block.startingPos || 0
    } else {
      const blockSize = block.content.length

      // If adding this block would exceed chunk size, split it into smaller chunks
      if (currentChunkSize + blockSize > chunkSize) {
        // Split the current block into smaller chunks
        const splitChunks = splitContentIntoChunks(
          block.content,
          currentHeading,
          block.startingPos || currentStartingPos,
        )
        chunks.push(...splitChunks)
      } else {
        currentChunk.push(block)
        currentChunkSize += blockSize
      }
      currentStartingPos += blockSize
    }
  }

  // Add any remaining content
  if (currentChunk.length > 0) {
    chunks.push({
      type: 'paragraph',
      content: currentChunk.map((b) => b.content).join('\n\n'),
      headingContext: currentHeading,
      startingPos: currentStartingPos,
    })
  }

  return chunks
}

export function chunkMarkdownByHeadings(markdownContent: string): MarkdownBlock[] {
  const blocks = parseMarkdownBlocks(markdownContent)
  return chunkContentWithHeadingContext(blocks)
}

export const chunkMarkdownByBlocksAndByCharsIfBig = async (markdownContent: string): Promise<MarkdownBlock[]> => {
  return chunkMarkdownByHeadings(markdownContent)
}
