import {
  BlockNoteEditor,
  BlockNoteEditorOptions,
  defaultBlockSchema,
  DefaultBlockSchema,
} from '@/editor/blocknote/core'
import { HMBlockSchema } from '@/editor/editor/schema'
import {DependencyList, useMemo, useRef} from 'react'
import {getDefaultReactSlashMenuItems} from '../SlashMenu/defaultReactSlashMenuItems'

const initEditor = <BSchema extends HMBlockSchema>(
  options: Partial<BlockNoteEditorOptions<BSchema>>,
) =>
  new BlockNoteEditor<BSchema>({
    slashMenuItems: getDefaultReactSlashMenuItems<BSchema | DefaultBlockSchema>(
      options.blockSchema || defaultBlockSchema,
    ),
    ...options,
  })
// const initEditor = <BSchema extends HMBlockSchema>(
//   options: Partial<BlockNoteEditorOptions<BSchema>>,
// ) => new BlockNoteEditor<BSchema>(options);


// /**
//  * Main hook for importing a BlockNote editor into a React project
//  */
export const useBlockNote = <
  BSchema extends HMBlockSchema = HMBlockSchema,
>(
  options: Partial<BlockNoteEditorOptions<BSchema>> = {},
  deps: any[] = [],
): BlockNoteEditor<BSchema> => {
  const editorRef = useRef<BlockNoteEditor<BSchema>>()

  return useMemo(() => {
    if (editorRef.current) {
      editorRef.current._tiptapEditor.destroy()
    }
    editorRef.current = initEditor(options)
    return editorRef.current
  }, deps) //eslint-disable-line
}
