import { Node } from '@tiptap/core'

const ImageBlock = Node.create({
  name: 'imageBlock',

  group: 'block',
  content: 'image+',
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[class="image-block"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, class: 'image-block' }, 0]
  },
})

export default ImageBlock
