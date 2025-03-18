import { Block, BlockNoteEditor, BlockSchema } from '@lib/blocknote'
import { Box, Menu } from '@mantine/core'
import { Forward, RefreshCcw } from '@tamagui/lucide-icons'
import * as _ from 'lodash'
import React, { useCallback, useRef, useState } from 'react'
import {
  RiChatQuoteLine,
  RiCodeBoxLine,
  RiHeading,
  RiListOrdered,
  RiListUnordered,
  RiMenuLine,
  RiText,
} from 'react-icons/ri'
import { updateGroup } from '@/lib/utils'
import RemoveBlockButton from './DefaultButtons/RemoveBlockButton'
import { DragHandleMenu, DragHandleMenuProps } from './DragHandleMenu'
import DragHandleMenuItem from './DragHandleMenuItem'
import { Popover, Text, XStack, YStack, SizableText } from 'tamagui'

const turnIntoItems = <BSchema extends BlockSchema>() => [
  {
    label: 'Paragraph',
    group: 'Block operations',
    Icon: RiText,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      editor.updateBlock(block, {
        type: 'paragraph',
        props: {},
      })
    },
  },
  {
    label: 'Heading',
    group: 'Block operations',
    Icon: RiHeading,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      editor.updateBlock(block, {
        type: 'heading',
        props: {},
      })
    },
  },
  {
    label: 'Code',
    group: 'Block operations',
    Icon: RiCodeBoxLine,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      editor.updateBlock(block, {
        type: 'code-block',
        props: {},
      })
    },
  },
  {
    label: 'Bullet item',
    group: 'Group operations',
    Icon: RiListUnordered,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      updateGroup(editor as BlockNoteEditor, block, 'ul')
    },
  },
  {
    label: 'Numbered item',
    group: 'Group operations',
    Icon: RiListOrdered,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      updateGroup(editor as BlockNoteEditor, block, 'ul')
    },
  },
  {
    label: 'Group item',
    group: 'Group operations',
    Icon: RiMenuLine,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      updateGroup(editor as BlockNoteEditor, block, 'group')
    },
  },

  {
    label: 'Blockquote item',
    group: 'Group operations',
    Icon: RiChatQuoteLine,
    onClick: ({ block, editor }: { block: Block<BSchema>; editor: BlockNoteEditor<BSchema> }) => {
      editor.focus()
      updateGroup(editor as BlockNoteEditor, block, 'blockquote')
    },
  },
]

const TurnIntoMenu = <BSchema extends BlockSchema>(props: DragHandleMenuProps<BSchema>) => {
  const [opened, setOpened] = useState(false)

  const menuCloseTimer = useRef<NodeJS.Timeout | null>(null)

  const startMenuCloseTimer = useCallback(() => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current)
    }
    menuCloseTimer.current = setTimeout(() => {
      setOpened(false)
    }, 250)
  }, [])

  const stopMenuCloseTimer = useCallback(() => {
    if (menuCloseTimer.current) {
      clearTimeout(menuCloseTimer.current)
    }
    setOpened(true)
  }, [])

  const groups = _.groupBy(turnIntoItems<BSchema>(), (i) => i.group)
  const renderedItems: any[] = []

  _.forEach(groups, (groupedItems) => {
    renderedItems.push(
      <SizableText size='$3' key={groupedItems[0].group}>
        {groupedItems[0].group}
      </SizableText>
    )

    for (const item of groupedItems) {
      renderedItems.push(
        <DragHandleMenuItem
          key={item.label}
          action={() => item.onClick(props)}
        >
          <item.Icon size={12} />
          <SizableText size='$2'>{item.label}</SizableText>
        </DragHandleMenuItem>
      )
    }
  })

  if (!props.block.type) {
    return null
  }

  return (
    <DragHandleMenuItem onMouseOver={stopMenuCloseTimer} onMouseLeave={startMenuCloseTimer}>
      <Popover
        open={opened}
        onOpenChange={setOpened}
        placement="right"
        offset={60}
      >
        <Popover.Trigger
          onMouseEnter={() => setOpened(true)}
          onMouseLeave={() => setOpened(false)}
        >
          <XStack gap="$2">
            <RefreshCcw size={14} />
            <SizableText size="$1">Turn into</SizableText>
          </XStack>
        </Popover.Trigger>
        <Popover.Content
          borderColor="$gray6"
          borderWidth={1}
          elevation='$6'
          padding='$1'
        >
          <YStack gap="$2">{renderedItems}</YStack>
        </Popover.Content>
      </Popover>
    </DragHandleMenuItem>
  )
}

const DefaultDragHandleMenu = <BSchema extends BlockSchema>(props: DragHandleMenuProps<BSchema>) => (
  <DragHandleMenu>
    <RemoveBlockButton {...props}><SizableText size='$1'>Delete</SizableText></RemoveBlockButton>
    <TurnIntoMenu {...props} /> 
  </DragHandleMenu>
)

export default DefaultDragHandleMenu
