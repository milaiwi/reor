import { Editor } from '@tiptap/core'
import { MarkdownSerializer, MarkdownSerializerState, MarkdownParser } from 'prosemirror-markdown'
import { Node as ProseMirrorNode, Schema } from '@tiptap/pm/model'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'
import markdownIt from 'markdown-it'

// Initialize and configure `markdown-it`
const md = markdownIt()

// Extend `markdown-it` to handle <div class="image-container">
md.use((mdInstance) => {
  mdInstance.block.ruler.before('html_block', 'image_container', (state, startLine, endLine) => {
    const pos = state.bMarks[startLine] + state.tShift[startLine]
    const max = state.eMarks[startLine]

    if (state.src.slice(pos, max).trim() !== '<div class="image-container">') {
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

    const token = state.push('html_block', '', 0)
    token.content = content.trim()
    token.map = [startLine, state.line]
    return true
  })
})

// Function to create a custom MarkdownParser using `markdown-it` and a dynamic schema
export const createCustomMarkdownParser = (schema: Schema) => {
  return new MarkdownParser(schema, md, {
    ...defaultMarkdownSerializer.nodes,

    imageContainer(state: any, token: any) {
      const content = token.content
      const imageMatches = content.match(/!\[.*?\]\((.*?)\)/g)
      const imageNodes: any[] = []

      if (imageMatches) {
        imageMatches.forEach((match: string) => {
          const srcMatch = match.match(/\((.*?)\)/)
          if (srcMatch) {
            const src = srcMatch[1]
            const imageNode = state.schema.nodes.image.create({ src })
            imageNodes.push(imageNode)
          }
        })
      }

      const imageContainerNode = state.schema.nodes.imageContainer.create({}, imageNodes)
      state.addNode(imageContainerNode)
    },
  })
}


function getMarkdown(editor: Editor) {
  // Fetch the current markdown content from the editor
  console.log("Getting markdown!")
  // const originalMarkdown = editor.storage.markdown.getMarkdown()
  const originalMarkdown = customMarkdownSerializer.serialize(editor.state.doc)
  console.log(`Original markdown: ${originalMarkdown}`)
  const modifiedMarkdown = originalMarkdown
    .replace(/\\\[/g, '[') // Replaces \[ with [
    .replace(/\\\]/g, ']') // Replaces \] wi ]

  return modifiedMarkdown
}


/**
 * Custom Serializer for our markdown. When we paste an image
 * we wrap it inside of an image-container. The default serializer
 * assumes the type is undefined and therefore throws an error and never
 * writes to file.
 */
const customMarkdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,

    // Custom rule for the `imageContainer` node
    imageContainer(state: MarkdownSerializerState, node: ProseMirrorNode) {
      // Start the image container
      state.write('<div class="image-container">\n')

      // Render the content of the imageContainer node
      node.forEach(childNode => {
        if (childNode.type.name === 'image') {
          const alt = childNode.attrs.alt ? childNode.attrs.alt.replace(/\n/g, '') : ''
          const src = childNode.attrs.src || ''
          const title = childNode.attrs.title ? ` "${childNode.attrs.title}"` : ''
          state.write(`![${alt}](${src}${title})\n`)
        }
      })

      state.write('</div>\n')
    },
  },
  defaultMarkdownSerializer.marks
)


export default getMarkdown
