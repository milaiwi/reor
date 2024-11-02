import { Node, nodeInputRule } from '@tiptap/core'
import { Attrs } from '@tiptap/pm/model'
import { Plugin } from '@tiptap/pm/state'

/**
 * This is very similar to https://github.com/ueberdosis/tiptap/blob/main/packages/extension-image/src/image.ts
 * except for the fact that we take in an uploadFunc which sends it to our electron storage. This is more dynamic
 * which allows us to later convert the image to a vector and store it.
 *
 * Matches following attributes in Markdown-typed image: [, alt, src, title]
 *
 * Example:
 * ![Lorem](image.jpg) -> [, "Lorem", "image.jpg"]
 * ![](image.jpg "Ipsum") -> [, "", "image.jpg", "Ipsum"]
 * ![Lorem](image.jpg "Ipsum") -> [, "Lorem", "image.jpg", "Ipsum"]
 */
const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

const Image = Node.create({
  name: 'image',

  inline: true,
  group: 'inline',
  draggable: true,

  addAttributes() {
    return {
      src: {},
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
        getAttrs: (dom) => ({
          src: dom.getAttribute('src'),
          title: dom.getAttribute('title'),
          alt: dom.getAttribute('alt'),
        }),
      },
    ]
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['img', HTMLAttributes]
  },

  addCommands() {
    return {
      insertImage:
        (attrs: Attrs | null | undefined) =>
        ({ state, dispatch }: { state: any; dispatch: any }) => {
          const { selection } = state
          const position = selection.$cursor ? selection.$cursor.pos : selection.$to.pos
          const node = this.type.create(attrs)
          const transaction = state.tr.insert(position, node)
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

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handleDOMEvents: {
            drop: (view, event) => {},
          },
          handlePaste: (view, event) => {
            /**
             *
             * @param file the uploaded file
             * @returns uploades the image as base64 along with its name to the file system
             */
            const uploadFunc = async (file: File) => {
              const reader = new FileReader()
              return new Promise((resolve, reject) => {
                reader.onloadend = async () => {
                  try {
                    const base64Image = reader.result as string
                    const fileName = file.name
                    const filePath = await window.electronStore.uploadImage({ base64Image, fileName })

                    const fileUrl = `local-resource://${encodeURIComponent(filePath)}` // Replace backslashes on Windows
                    resolve(fileUrl)
                  } catch (error) {
                    console.error(`Image upload failed: ${error}`)
                    reject(error)
                  }
                }
                reader.onerror = () => {
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
                console.log(`Sending image to backend!`)
                reader.onload = async () => {
                  const uploadedImageUrl = await uploadFunc(image)
                  const node = view.state.schema.nodes.image.create({
                    src: uploadedImageUrl,
                  })

                  const transaction = view.state.tr.replaceSelectionWith(node)
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

export default Image
