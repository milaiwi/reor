import React from 'react'
import { MdDragIndicator } from 'react-icons/md'
import { Popover } from 'tamagui'
import { BlockSchema } from '@/lib/blocknote/core'
import DefaultDragHandleMenu from '../DragHandleMenu/DefaultDragHandleMenu'
import SideMenuButton from '../SideMenuButton'
import { SideMenuProps } from '../SideMenuPositioner'

const DragHandle = <BSchema extends BlockSchema>(props: SideMenuProps<BSchema>) => {
  const DragHandleMenu = props.dragHandleMenu || DefaultDragHandleMenu

  return (
    <Popover
      allowFlip
      placement="right"
      size="$5"
      onOpenChange={(open) => (open ? props.freezeMenu() : props.unfreezeMenu())}
    >
      <Popover.Trigger>
        <div draggable="true" onDragStart={props.blockDragStart} onDragEnd={props.blockDragEnd}>
          <SideMenuButton>
            <MdDragIndicator size={18} data-test="dragHandle" />
          </SideMenuButton>
        </div>
      </Popover.Trigger>

      <DragHandleMenu editor={props.editor} block={props.block} />
    </Popover>
  )
}

export default DragHandle
