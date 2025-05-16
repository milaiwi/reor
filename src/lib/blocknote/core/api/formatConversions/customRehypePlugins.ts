import { visit } from 'unist-util-visit'
import { defaultHandlers } from 'remark-rehype'

export function removeSingleSpace() {
  // TODO: Give a specific type
  return (tree: any) => {
    visit(tree, 'text', (node) => {
      node.value = node.value.replace(/\u00A0/g, '')
    })
  }
}

// Custom plugin that converts empty lines to a single space.
export function preserveEmptyParagraphs() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      if (node.tagName === 'p' && (!node.children || node.children.length === 0)) {
        node.children = [{ type: 'text', value: '\u00A0' }] // Add a non-breaking space
      }
    })
  }
}

/**
 * Recursive function to handle lists of any depth in rehype-remark
 * Properly maintains list levels throughout the conversion process
 */
export function handleList(state: any, node: any) {
  // Get the list level from the node properties or default to 1
  const listLevel = node.properties?.['data-list-level'] || '1'
  const listType = node.tagName === 'ol' ? 'ol' : 'ul'
  const start = node.properties?.start || null
  
  // Create the base list element with proper list level attribute
  const result = {
    type: 'list',
    ordered: listType === 'ol',
    spread: false,
    children: [] as any[],
    data: {
      hProperties: {
        'data-list-level': listLevel
      }
    }
  }
  
  // Add start attribute for ordered lists if available
  // if (listType === 'ol' && start) {
  //   result.data.hProperties.start = start
  // }

  // Process each list item
  for (const child of node.children) {
    if (child.tagName === 'li') {
      const listItem = {
        type: 'listItem',
        spread: false,
        children: [] as any[]
      }
      
      // Process the children of each list item
      for (const itemChild of child.children) {
        if (itemChild.tagName === 'p') {
          // Add paragraph content
          listItem.children.push(state.all(itemChild))
        } else if (itemChild.tagName === 'ul' || itemChild.tagName === 'ol') {
          // Handle nested lists - increment the list level
          const nestedListLevel = (parseInt(listLevel) + 1).toString()
          
          // Set the nested list level
          if (!itemChild.properties) {
            itemChild.properties = {}
          }
          itemChild.properties['data-list-level'] = nestedListLevel
          
          // Process the nested list recursively
          listItem.children.push(handleList(state, itemChild))
        } else {
          // Handle other content types
          listItem.children.push(state.all(itemChild))
        }
      }
      
      result.children.push(listItem)
    }
  }
  
  return result
}

/**
 * Rehype plugin to preserve list levels in the markdown output
 */
export function preserveListLevels() {
  return (tree: any) => {
    visit(tree, 'element', (node) => {
      // Look for lists with data-list-level attribute
      if ((node.tagName === 'ul' || node.tagName === 'ol') && node.properties && node.properties['data-list-level']) {
        // Ensure the data attribute is preserved for the transformation
        if (!node.data) {
          node.data = {}
        }
        if (!node.data.hProperties) {
          node.data.hProperties = {}
        }
        node.data.hProperties['data-list-level'] = node.properties['data-list-level']
      }
    })
  }
}



// modefied version of https://github.com/syntax-tree/mdast-util-to-hast/blob/main/lib/handlers/code.js
// that outputs a data-language attribute instead of a CSS class (e.g.: language-typescript)
export function code(state: any, node: any) {
  const value = node.value ? `${node.value}\n` : ''
  /** @type {Properties} */
  const properties: any = {}

  if (node.lang) {
    // changed line
    properties['data-language'] = node.lang
  }

  // Create `<code>`.
  /** @type {Element} */
  let result: any = {
    type: 'element',
    tagName: 'code',
    properties,
    children: [{ type: 'text', value }],
  }

  if (node.meta) {
    result.data = { meta: node.meta }
  }

  state.patch(node, result)
  result = state.applyData(node, result)

  // Create `<pre>`.
  result = {
    type: 'element',
    tagName: 'pre',
    properties: {},
    children: [result],
  }
  state.patch(node, result)
  return result
}

/**
 * Matches any video markdown and converst them to nodes.
 */
export function handleMedia(state: any, node: any) {
  if (node.type !== 'paragraph' || !node.children?.[0]?.value) {
    return defaultHandlers.paragraph(state, node)
  }

  const textValue = node.children[0].value.trim()

  if (textValue.startsWith('![')) {
    // Check if video
    if (node.children.length === 3) {
      // Found video
      const url = node.children[1].url
      const width = node.children[2].value.match(/width=(\d+)/)

      const result = {
        type: 'element',
        tagName: 'iframe',
        properties: {
          src: url,
          title: 'youtube',
          width: width ? width[1] : '',
        },
        children: [],
      }

      state.patch(node, result)
      return state.applyData(node, result)
    }
  } else if (textValue.startsWith('[')) {
    // Check if image
    const match = textValue.match(/\[(.*?)\]\((.*?)\s*"width=(.*?)"\)/)

    if (match) {
      const [, alt, url, width] = match

      const result = {
        type: 'element',
        tagName: 'img',
        properties: {
          src: url,
          alt: alt || '',
          width: width || '',
        },
        children: [],
      }

      state.patch(node, result)
      return state.applyData(node, result)
    }
  }

  return defaultHandlers.paragraph(state, node)
}
