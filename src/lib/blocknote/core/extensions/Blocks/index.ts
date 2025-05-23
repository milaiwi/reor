import { Node } from '@tiptap/core'

export { BlockContainer } from './nodes/BlockContainer'
export { default as BlockGroup } from './nodes/BlockGroup'
export const Doc = Node.create({
  name: 'doc',
  topNode: true,
  content: 'blockGroup',
})
