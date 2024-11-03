// Import necessary TipTap and ProseMirror components
import { Node, nodeInputRule } from '@tiptap/core'
import { Node as ProseMirrorNode } from '@tiptap/pm/model'
import { Plugin, EditorState, Transaction } from '@tiptap/pm/state'
import { EditorView } from '@tiptap/pm/view'

/**
 * Regular expression to match Markdown image syntax.
 * Example:
 * ![alt](src "title")
 */
const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:\s+["'](\S+)["'])?\)/

/**
 * Define the Image node as a block-level node.
 */
const Image = Node.create({
  name: 'image',

  group: 'block',
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      alt: {
        default: null as string | null,
      },
      src: {
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
          alt: dom.getAttribute('alt'),
          title: dom.getAttribute('title'),
          src: dom.getAttribute('src'),
        }),
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', HTMLAttributes]
  },

  addCommands() {
    return {
      insertImage:
        (attrs) =>
        ({ state, dispatch }) => {
          const { selection } = state
          const position = selection.$cursor ? selection.$cursor.pos : selection.$to.pos
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
        getAttributes: (match) => {
          const [, alt, src, title] = match
          return { src, alt, title }
        },
      }),
    ]
  },
})

/**
 * Define the ImageContainer node.
 */
const ImageContainer = Node.create({
  name: 'imageContainer',

  group: 'block',
  content: 'image+',
  draggable: true,

  parseHTML() {
    return [
      {
        tag: 'div[class="image-container"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', { ...HTMLAttributes, class: 'image-container' }, 0]
  },
})

/**
 * Handle image drag-and-drop functionality.
 */
const imageDragAndDropPlugin = new Plugin({
  props: {
    handleDrop(view: EditorView, event: DragEvent, _slice, moved) {
      const { state } = view
      const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
      if (pos == null) return false

      const $pos = state.doc.resolve(pos)
      const node = view.dragging?.slice.content.firstChild
      if (!node || node.type.name !== 'image') return false

      event.preventDefault()
      let tr = state.tr

      // Remove the image from its original position if moved
      if (moved) {
        tr = tr.deleteSelection()
      }

      // Determine if we're dropping onto an imageContainer
      let insertPos = pos
      let insertInsideContainer = false

      if ($pos.nodeAfter && $pos.nodeAfter.type.name === 'imageContainer') {
        // Insert at the start of the imageContainer
        insertPos = pos + 1
        insertInsideContainer = true
      } else if ($pos.nodeBefore && $pos.nodeBefore.type.name === 'imageContainer') {
        // Insert at the end of the imageContainer
        insertPos = pos - $pos.nodeBefore.nodeSize + 1
        insertInsideContainer = true
      }

      if (insertInsideContainer) {
        // Insert the image inside the existing imageContainer
        tr = tr.insert(insertPos, node)
      } else {
        // Create a new imageContainer with the image
        const imageContainerNode = state.schema.nodes.imageContainer.create({}, node)
        tr = tr.insert(pos, imageContainerNode)
      }

      view.dispatch(tr)
      return true
    },
  },
})

/**
 * Image extension with paste handling.
 */
const ImageExtension = Image.extend({
  addProseMirrorPlugins() {
    return [
      imageDragAndDropPlugin,
      new Plugin({
        props: {
          handlePaste: (view: EditorView, event: ClipboardEvent): boolean => {
            const items = event.clipboardData?.items
            if (!items) {
              return false
            }

            for (const item of items) {
              if (item.type.indexOf('image') === 0) {
                event.preventDefault()
                const image = item.getAsFile()
                if (!image) return false

                ;(async () => {
                  try {
                    const uploadedImageUrl = await uploadFunc(image)
                    const imageNode = view.state.schema.nodes.image.create({
                      src: uploadedImageUrl,
                    })
                    const imageContainerNode = view.state.schema.nodes.imageContainer.create({}, imageNode)

                    /* Logging */
                    // console.log(`ImageNode: ${JSON.stringify(imageNode)}`);
                    // console.log(`ImageContainerNode: ${JSON.stringify(imageContainerNode)}`)

                    const transaction = view.state.tr.replaceSelectionWith(imageContainerNode)
                    view.dispatch(transaction)
                  } catch (error) {
                    console.error('Error uploading image:', error)
                  }
                })()

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

/**
 * Function to upload the image and return its URL.
 */
async function uploadFunc(file: File): Promise<string> {
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
        reject(error)
      }
    }
    reader.onerror = () => {
      reject(new Error('Failed to read image file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Export the ImageExtension and ImageContainer.
 */
export default [ImageExtension, ImageContainer]
