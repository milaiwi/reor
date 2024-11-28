// eslint-disable-next-line import/no-extraneous-dependencies
import { BlockNoteEditor } from '@blocknote/core'

async function getMarkdown(editor: BlockNoteEditor) {
  // Fetch the current markdown content from the editor
  const originalMarkdown = await editor.blocksToMarkdownLossy()
  // Replace the escaped square brackets with unescaped ones
  const modifiedMarkdown = originalMarkdown
    .replace(/\\\[/g, '[') // Replaces \[ with [
    .replace(/\\\]/g, ']') // Replaces \] wi ]
  return modifiedMarkdown
}

export default getMarkdown
