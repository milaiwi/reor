import { Node, nodeInputRule, findChildren } from '@tiptap/core'
import { Node as ProseMirrorNode, Attrs, Schema } from '@tiptap/pm/model'
import { Plugin, TextSelection, Transaction, EditorState } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

const Image = Node.create({
  name: 'image',

  group: '',
  draggable: true,

  addAttributes() {
    return {
      src: { },
      alt: {
        default: null as string | null,
      },
      title: {
        default: null as string | null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom: HTMLElement) => ({
          src: dom.getAttribute('src'),
          title: dom.getAttribute('title'),
          alt: dom.getAttribute('alt'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['img', HTMLAttributes]
  },

  addCommands() {
    return {
      insertImage:
        (attrs: Attrs | null | undefined) =>
        ({ state, dispatch }: { state: EditorState; dispatch: (tr: Transaction) => void }) => {
          const { selection } = state
          const position = selection.$cursor ? selection.$cursor.pos : selection.$to.pos
          console.log(`THIS object: ${JSON.stringify(this)}`)
          const imageNode = this.type.create(attrs)
          const imageContainerNode = state.schema.nodes.imageContainer.create({}, imageNode)
          const transaction = state.tr.insert(position, imageContainerNode)
          dispatch(transaction)
          return true
        },
    }
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: IMAGE_INPUT_REGEX,
        type: this.type,
        getAttributes: (match: RegExpMatchArray) => {
          const [, alt, src, title] = match
          return { src, alt, title }
        },
      }),
    ]
  },
})

export const ImageContainer = Node.create({
  name: 'imageContainer',

  group: 'block',
  content: 'image+',
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div.image-container',
      },
    ]
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['div', { ...HTMLAttributes, class: 'image-container' }, 0]
  },
})

const imageDragAndDropPlugin = new Plugin({
  props: {
    handleDrop(view: EditorView, event: DragEvent, slice, moved) {
      // Get the drop position
      const coords = { left: event.clientX, top: event.clientY }
      const pos = view.posAtCoords(coords)?.pos

      if (pos == null) {
        return false
      }

      // Get the node being dragged
      const draggedNode = view.dragging?.slice.content.firstChild
      if (!draggedNode) {
        return false
      }

      // If the dragged node is not an image, let the default behavior occur
      if (draggedNode.type.name !== 'image') {
        return false
      }

      event.preventDefault()

      const state = view.state
      const tr = state.tr

      // Remove the dragged image from its original position
      if (moved) {
        tr.deleteSelection()
      }

      // Determine if we're dropping onto an imageContainer
      const $pos = tr.doc.resolve(pos)
      let targetPos = pos
      let insertInsideContainer = false

      if ($pos.nodeAfter && $pos.nodeAfter.type.name === 'imageContainer') {
        // Insert at the start of the imageContainer
        targetPos = pos + 1 // Inside the imageContainer
        insertInsideContainer = true
      } else if ($pos.nodeBefore && $pos.nodeBefore.type.name === 'imageContainer') {
        // Insert at the end of the imageContainer
        targetPos = pos - $pos.nodeBefore.nodeSize + 1 // Inside the imageContainer
        insertInsideContainer = true
      }

      if (insertInsideContainer) {
        // Insert the image inside the existing imageContainer
        tr.insert(targetPos, draggedNode)
      } else {
        // Create a new imageContainer with the image
        const imageContainerNode = state.schema.nodes.imageContainer.create({}, draggedNode)
        tr.insert(pos, imageContainerNode)
      }

      view.dispatch(tr)
      return true
    },
  },
})

const ImageExtension = Image.extend({
  addProseMirrorPlugins() {
    return [
      imageDragAndDropPlugin,
      new Plugin({
        props: {
          handlePaste: (view: EditorView, event: ClipboardEvent): boolean => {
            const uploadFunc = async (file: File): Promise<string> => {
              const reader = new FileReader()
              return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                  try {
                    const base64Image = reader.result as string
                    const fileName = file.name
                    const filePath = await window.electronStore.uploadImage({
                      base64Image,
                      fileName,
                    })

                    const fileUrl = `local-resource://${encodeURIComponent(filePath)}`
                    resolve(fileUrl)
                  } catch (error) {
                    console.log("Rejecting in uploadFunc")
                    reject(error)
                  }
                }
                reader.onerror = () => {
                  console.log("Rejecting since failed to read image file")
                  reject(new Error('Failed to read image file'))
                }

                reader.readAsDataURL(file)
              })
            }

            const items = event.clipboardData?.items
            if (!items) {
              return false
            }

            for (const item of items) {
              if (item.type.indexOf('image') === 0) {
                event.preventDefault()
                const image = item.getAsFile()

                if (!image) return false

                const reader = new FileReader()
                reader.onload = async () => {
                  const uploadedImageUrl = await uploadFunc(image)
                  const imageNode = view.state.schema.nodes.image.create({
                    src: uploadedImageUrl,
                  })
                  const imageContainerNode = view.state.schema.nodes.imageContainer.create({}, imageNode)
                  const transaction = view.state.tr.replaceSelectionWith(imageContainerNode)
                  view.dispatch(transaction)
                }

                reader.readAsDataURL(image)
                return true
              }
            }
            return false
          },
        },
      }),
    ]
  },
})

export default ImageExtension
