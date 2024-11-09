import { MarkdownSerializer, MarkdownSerializerState } from 'prosemirror-markdown'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { defaultMarkdownSerializer } from 'prosemirror-markdown'

const customMarkdownSerializer = new MarkdownSerializer(
  {
    ...defaultMarkdownSerializer.nodes,
    imageBlock(state: MarkdownSerializerState, node: ProseMirrorNode) {
      state.write('<div class="image-block">\n')
      node.forEach((childNode) => {
        if (childNode.type.name === 'image') {
          const alt = childNode.attrs.alt ? childNode.attrs.alt.replace(/\n/g, '') : ''
          const src = childNode.attrs.src || ''
          const title = childNode.attrs.title ? ` "${childNode.attrs.title}"` : ''
          state.write(`![${alt}](${src}${title})\n`)
        }
      })
      state.write('</div>\n')
    },
    image(state: MarkdownSerializerState, node: ProseMirrorNode) {
      const alt = node.attrs.alt ? node.attrs.alt.replace(/\n/g, '') : ''
      const src = node.attrs.src || ''
      const title = node.attrs.title ? ` "${node.attrs.title}"` : ''
      state.write(`![${alt}](${src}${title})`)
    },
  },
  defaultMarkdownSerializer.marks
)

export default customMarkdownSerializer
