import React, { ReactNode } from 'react'
import { Popover } from 'tamagui'
import { Block, BlockNoteEditor, BlockSchema } from '@/lib/blocknote/core'

export type DragHandleMenuProps<BSchema extends BlockSchema> = {
  editor: BlockNoteEditor<BSchema>
  block: Block<BSchema>
}

export const DragHandleMenu = (props: { children: ReactNode }) => {
  return (
    <Popover.Content
      padding="$2"
      width="$12"
      borderColor="$gray6"
      borderWidth={1}
      alignItems="left"
      borderRadius="$2"
      elevation="$6"
      gap="$2"
    >
      {props.children}
    </Popover.Content>
  )
}
