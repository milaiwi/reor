import { useEffect } from 'react'
import { BlockNoteEditor, BlockSchema } from '../../core'

export function useEditorSelectionChange<BSchema extends BlockSchema>(
  editor: BlockNoteEditor<BSchema>,
  callback: () => void,
) {
  useEffect(() => {
    editor.tiptapEditor.on('selectionUpdate', callback)

    return () => {
      editor.tiptapEditor.off('selectionUpdate', callback)
    }
  }, [callback, editor.tiptapEditor])
}
