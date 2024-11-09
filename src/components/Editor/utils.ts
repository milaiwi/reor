import { Editor } from '@tiptap/core'
import customMarkdownSerializer from './customMarkdownSerializer'

function getMarkdown(editor: Editor) {
  // Fetch the current markdown content from the editor
  console.log("In getMarkdown()")
  const originalMarkdown = customMarkdownSerializer.serialize(editor.state.doc)
  // const originalMarkdown = editor.storage.markdown.getMarkdown()
  // console.log(`originalMarkdown: ${originalMarkdown}`)
  console.log(`Doc: ${editor.state.doc}`)
  // Replace the escaped square brackets with unescaped ones
  const modifiedMarkdown = originalMarkdown
    .replace(/\\\[/g, '[') // Replaces \[ with [
    .replace(/\\\]/g, ']') // Replaces \] wi ]

  return modifiedMarkdown
}

export default getMarkdown
