import { useEffect } from 'react'
import { BlockNoteEditor, BlockSchema } from '@/editor/blocknote/core'

export function useEditorContentChange<BSchema extends BlockSchema>(
  editor: BlockNoteEditor<BSchema>,
  callback: () => void,
) {
  useEffect(() => {
    editor.tiptapEditor.on('update', callback)

    return () => {
      editor.tiptapEditor.off('update', callback)
    }
  }, [callback, editor.tiptapEditor])
}
