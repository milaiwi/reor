import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { EditorView } from 'prosemirror-view'
import { Node as ProseMirrorNode } from 'prosemirror-model'

const imageHandlingPluginKey = new PluginKey('imageTableDragDrop')

/**
 * Matches the Markdown image syntax:
 * ![Alt Text](image-url "Optional Title")
 */
const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/

const ImageTableDragDropExtension = Extension.create({
  name: 'imageHandling',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: imageHandlingPluginKey,

        props: {
          handleDOMEvents: {
            drop: (view: EditorView, event: DragEvent) => {
              const { schema } = view.state
              const data = event.dataTransfer
              if (!data) return false

              const files = Array.from(data.files).filter(file => file.type.startsWith('image/'))
              if (files.length === 0) return false

              event.preventDefault()

              const { state, dispatch } = view
              const { selection } = state
              const { from, to } = selection

              // Determine if the drop is within a table
              const $from = state.doc.resolve(from)
              const table = findTable($from)
              if (table) {
                // Drop is inside a table; insert image into the corresponding cell
                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    const src = reader.result as string
                    const imageNode = schema.nodes.image.create({
                      src,
                      alt: 'Dropped Image',
                      title: null,
                    })
                    const transaction = state.tr.replaceSelectionWith(imageNode)
                    dispatch(transaction)
                  }
                  reader.readAsDataURL(file)
                })
              } else {
                // Drop is outside a table; insert a new table with the images
                const imageSources: string[] = []
                let readCount = 0

                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onload = () => {
                    imageSources.push(reader.result as string)
                    readCount++
                    if (readCount === files.length) {
                      // Insert table
                      const tableNode = createImageTable(schema, imageSources)
                      const transaction = state.tr.replaceSelectionWith(tableNode)
                      dispatch(transaction)
                    }
                  }
                  reader.readAsDataURL(file)
                })
              }

              return true
            },
          },
          handlePaste: (view, event) => {
            const clipboardData = event.clipboardData
            if (!clipboardData) return false

            const items = Array.from(clipboardData.items)
            const imageFiles = items
                .filter(item => item.type.startsWith('image/'))
                .map(item => item.getAsFile())
                .filter(file => file != null) as File[]
            
            /**
             * @param File: the uploaded file
             * @returns uploads the image as base64 along with its name to the file system
             */
            const uploadImage = async (file: File): Promise<string | null> => {
                const reader = new FileReader()
                return new Promise((resolve) => {
                    reader.onloadend = async () => {
                        try {
                            const base64Image = reader.result as string
                            const fileName = file.name
                            const filePath = await window.electronStore.uploadImage({ base64Image, fileName })
                            const fileURL = `local-resource://${encodeURIComponent(filePath)}`
                            resolve(fileURL)
                        } catch (error) {
                            console.error(`Image upload failed: ${error}`)
                            resolve(null)
                        }
                    }
                    reader.onerror = () => {
                        console.error(`Failed to read image file`)
                        resolve(null)
                    }
                    reader.readAsDataURL(file)
                })
            }


            if (imageFiles.length == 0) {
                const image = imageFiles[0]
                const imageURL = uploadImage(image)
                if (imageURL) {
                    const node = view.state.schema.nodes.image.create({
                        src: imageURL,
                        alt: image.name,
                        title: image.name
                    })
                    const transaction = view.state.tr.replaceSelectionWith(node)
                    view.dispatch(transaction)
                }
            } else {
                Promise.all(imageFiles.map(file => uploadImage(file)))
                  .then(response => {
                    const validImageURLs = response.filter(url => url !== null) as string[]

                    if (validImageURLs.length > 0) {
                      const tableNode = createImageTable(view.state.schema, validImageURLs)
                      const transaction = view.state.tr.replaceSelectionWith(tableNode)
                      view.dispatch(transaction)
                  }                  
                })
                .catch(error => {
                  console.error(`Error uploading images: ${error}`)
                })
            }

            return true
          }
        },
      }),
    ]
  },
})

// Helper function to find the table node containing the current selection
function findTable($pos: any): ProseMirrorNode | null {
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth)
    if (node.type.name === 'table') {
      return node
    }
  }
  return null
}

// Helper function to create a table node with images
function createImageTable(schema: any, imageSources: string[]): ProseMirrorNode {
  const table = schema.nodes.table.create(
    {},
    [
      schema.nodes.tableRow.create(
        {},
        imageSources.map(src =>
          schema.nodes.tableCell.create(
            {},
            schema.nodes.image.create({
              src,
              alt: 'Grouped Image',
              title: null,
            })
          )
        )
      ),
    ]
  )
  return table
}


export default ImageTableDragDropExtension
