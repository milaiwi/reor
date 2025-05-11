// Define block types for the main process
export interface Block {
  id: string
  type: string
  props: {
    level?: number
    [key: string]: any
  }
  content: string
  children: Block[]
}

export interface BlockSchema {
  [key: string]: {
    props?: {
      [key: string]: {
        default?: any
      }
    }
    content?: string
  }
}

export const blockSchema: BlockSchema = {
  paragraph: {
    props: {},
    content: 'inline*',
  },
  heading: {
    props: {
      level: { default: 1 },
    },
    content: 'inline*',
  },
  bulletListItem: {
    content: 'block+',
  },
  numberedListItem: {
    content: 'block+',
  },
  codeBlock: {
    content: 'text*',
  },
  blockquote: {
    content: 'block+',
  },
  image: {
    props: {
      url: { default: '' },
      alt: { default: '' },
    },
  },
  link: {
    props: {
      url: { default: '' },
    },
    content: 'inline*',
  },
}
