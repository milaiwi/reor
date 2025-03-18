import React, { ReactNode } from 'react'

import { XStack } from 'tamagui'
import { Delete } from '@tamagui/lucide-icons'
import { BlockSchema } from '@/lib/blocknote/core'
import { DragHandleMenuProps } from '../DragHandleMenu'
import DragHandleMenuItem from '../DragHandleMenuItem'

const RemoveBlockButton = <BSchema extends BlockSchema>(
  props: DragHandleMenuProps<BSchema> & { children: ReactNode },
) => {
  return (
    <DragHandleMenuItem action={() => props.editor.removeBlocks([props.block])}>
      <Delete size={14} />
      {props.children}
    </DragHandleMenuItem>
  )
}

export default RemoveBlockButton
