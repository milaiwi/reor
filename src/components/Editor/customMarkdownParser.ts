import { MarkdownParser } from 'prosemirror-markdown'
import markdownIt from 'markdown-it'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'
import { Schema } from 'prosemirror-model'

export const createCustomMarkdownParser = (schema: Schema | undefined) => {
  const md = markdownIt()

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

      console.log("Pushing state to token")
      const token = state.push('image_block', '', 0)
      token.content = content.trim()
      token.map = [startLine, state.line]
      console.log("Returning true")
      return true
    })
  })

  if (!schema) throw new Error("Schema is undefined, can't create MarkdownParser.")

  console.log("Returning markdownParser")
  return new MarkdownParser(schema, md, {
    ...defaultMarkdownSerializer.nodes,
    
    // Add a custom rule for parsing the image_block
    image_block(state: any, token: any) {
      console.log("Inside imageBlock")
      const content = token.content
      const imageMatches = content.match(/!\[.*?\]\(.*?\)/g)
      const imageNodes: any[] = []

      console.log(`Content: ${content}`)
      if (imageMatches) {
        imageMatches.forEach((match: string) => {
          const altMatch = match.match(/!\[(.*?)\]/)
          const srcMatch = match.match(/\((.*?)\)/)
          const alt = altMatch ? altMatch[1] : ''
          const src = srcMatch ? srcMatch[1] : ''

          const imageNode = state.schema.nodes.image?.create({ src, alt })
          if (imageNode) imageNodes.push(imageNode)
        })
      }

      const imageBlockNode = state.schema.nodes.imageBlock?.create({}, imageNodes)
      if (imageBlockNode) state.addNode(imageBlockNode)
    },
    
    // Define the standard image node parsing
    image(state: any, token: { attrs: any }) {
      const attrs = token.attrs || {}
      const imageNode = state.schema.nodes.image?.create(attrs)
      if (imageNode) state.addNode(imageNode)
    },
  })
}
