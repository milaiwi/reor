// customMarkdownParser.ts
import { MarkdownParser } from 'prosemirror-markdown'
import markdownIt from 'markdown-it'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'
import { Schema } from 'prosemirror-model'

export const createCustomMarkdownParser = (schema: Schema) => {
  const md = markdownIt()

  // Extend markdown-it to handle <div class="image-block">
  md.use((mdInstance) => {
    mdInstance.block.ruler.before('html_block', 'image_block', (state, startLine, endLine) => {
      const pos = state.bMarks[startLine] + state.tShift[startLine]
      const max = state.eMarks[startLine]

      if (state.src.slice(pos, max).trim() !== '<div class="image-block">') {
        return false
      }

      let nextLine = startLine + 1
      let content = ''

      while (nextLine < endLine) {
        const nextPos = state.bMarks[nextLine] + state.tShift[nextLine]
        const nextMax = state.eMarks[nextLine]
        const line = state.src.slice(nextPos, nextMax).trim()

        if (line === '</div>') {
          state.line = nextLine + 1
          break
        }

        content += line + '\n'
        nextLine++
      }

      const token = state.push('image_block', '', 0)
      token.content = content.trim()
      token.map = [startLine, state.line]
      return true
    })
  })

  return new MarkdownParser(schema, md, {
    ...defaultMarkdownSerializer.nodes,
    image_block(state: any, token: any) {
      const content = token.content
      const imageMatches = content.match(/!\[.*?\]\(.*?\)/g)
      const imageNodes: any[] = []

      if (imageMatches) {
        imageMatches.forEach((match: string) => {
          const altMatch = match.match(/!\[(.*?)\]/)
          const srcMatch = match.match(/\((.*?)\)/)
          const alt = altMatch ? altMatch[1] : ''
          const src = srcMatch ? srcMatch[1] : ''

          const imageNode = state.schema.nodes.image.create({ src, alt })
          imageNodes.push(imageNode)
        })
      }

      const imageBlockNode = state.schema.nodes.imageBlock.create({}, imageNodes)
      state.addNode(imageBlockNode)
    },
    image(state: any, token: { attrs: {} }) {
      const attrs = token.attrs || {}
      state.addNode(state.schema.nodes.image, attrs)
    },
  })
}
