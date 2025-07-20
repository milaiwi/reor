import React, { ReactNode } from 'react'

import { Delete } from 'lucide-react'
import { BlockSchema } from '@/lib/blocknote/core'
import { DragHandleMenuProps } from '../DragHandleMenu'
import DragHandleMenuItem from '../DragHandleMenuItem'

const RemoveBlockButton = <BSchema extends BlockSchema>(
  props: DragHandleMenuProps<BSchema> & { children: ReactNode },
) => {
  return (
    <DragHandleMenuItem onClick={() => props.editor.removeBlocks([props.block])}>
      <div className="flex gap-2">
        <Delete size={14} />
        {props.children}
      </div>
    </DragHandleMenuItem>
  )
}

export default RemoveBlockButton
