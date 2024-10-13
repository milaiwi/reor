import { Node, nodeInputRule } from '@tiptap/core'
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
const IMAGE_INPUT_REGEX = /!\[(.+|:?)\]\((\S+)(?:(?:\s+)["'](\S+)["'])?\)/;

export default class Image extends Node {
    uploadFunc: any = null


    constructor(name: any, parent: any, uploadFunc = null) {
        super({
            name,
            parent
        })

        this.uploadFunc = async (file: any): Promise<any> => {
            console.log('Upload function is called!')
        }
    }


    get name() {
        return 'image'
    }

    get schema() {
        return {
            inline: true,
            attrs: {
                src: {},
                alt: {
                    default: null,
                },
                title: {
                    default: null,
                },
            },
            group: 'inline',
            draggable: true,
            parseDom: [
                {
                    tag: 'img[src]',
                    getAttrs: (dom: any) => ({
                        src: dom.getAttribute('src'),
                        title: dom.getAttribute('title'),
                        alt: dom.getAttribute('alt'),
                    }),
                },
            ],
            toDOM: (node: any) => ['img', node.attrs],
        }
    }

    commands({ type }: { type: any}) {
        return (attrs: any) => (state: any, dispatch: any) => {
            const { selection } = state
            const position = selection.$cursor ? selection.$cursor.pos : selection.$to.pos
            const node = type.create(attrs)
            const transaction = state.tr.insert(position, node)
            dispatch(transaction)
        }
    }

    inputRules({ type }: { type: any }) {
        return [ 
            nodeInputRule({
                find: IMAGE_INPUT_REGEX,
                type,
                getAttributes: (match) => {
                    const [, alt, src, title] = match
                    return {
                        src,
                        alt,
                        title,
                    }
                }
            })
        ]
    }

    get plugins() {
        const upload = this.uploadFunc
        return [
            new Plugin({
                props: {
                    handleDOMEvents: {
                        drop(view, event) {
                            const hasFiles = event.dataTransfer
                            && event.dataTransfer.files
                            && event.dataTransfer.files.length

                            if (!hasFiles)
                                return

                            const images = Array
                                .from(event.dataTransfer.files)
                                .filter((file: any) => (/image/i).test(file.type))

                            console.log(`Images: ${JSON.stringify(images)}`)
                            if (images.length === 0)
                                return

                            event.preventDefault()

                            const { schema } = view.state
                            const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY})

                            if (!coordinates) {
                                console.log('Coordinates is null!')
                                return
                            }
                            images.forEach(async (image: any) => {
                                const reader = new FileReader()

                                if (upload) {
                                    const node = schema.nodes.image.create({
                                        src: await upload(image),
                                    })
                                    const transaction = view.state.tr.insert(coordinates.pos, node)
                                    view.dispatch(transaction)
                                } else {
                                    reader.onload = readerEvent => {
                                        const node = schema.nodes.image.create({
                                            src: readerEvent.target?.result,
                                        })
                                        const transaction = view.state.tr.insert(coordinates.pos, node)
                                        view.dispatch(transaction)
                                    }
                                    reader.readAsDataURL(image)
                                }
                            })
                        },
                    },
                    handlePaste(view, event, slice) {
                        const items = event.clipboardData?.items
                        if (!items) {
                            console.log("Items is empty")
                            return
                        }

                        for (const item of items) {
                            if (item.type.indexOf('image') === 0) {
                                event.preventDefault()
                                const { schema } = view.state

                                const image = item.getAsFile()
                                
                                if (!image) {
                                    console.log(`image is null`)
                                    return
                                }
                                console.log(`Image: ${image}`)

                                if (upload) {
                                    upload(image).then((src: any) => {
                                        const node = schema.nodes.image.create({
                                            src: src,
                                        })
                                        const transaction = view.state.tr.replaceSelectionWith(node)
                                        view.dispatch(transaction)
                                    })
                                } else {
                                    const reader = new FileReader()
                                    reader.onload = readerEvent => {
                                        const node = schema.nodes.iamge.create({
                                            src: readerEvent.target?.result,
                                        })
                                        const transaction = view.state.tr.replaceSelectionWith(node)
                                        view.dispatch(transaction)
                                    }
                                    reader.readAsDataURL(image)
                                }
                            }
                        }
                        return false
                    },
                },
            }),
        ]
    }
}
