import React, { ReactNode } from 'react'
import { XStack } from 'tamagui'

type DragHandleMenuItemProps = {
  action?: () => void
  children: ReactNode
} & React.ComponentProps<typeof XStack>

const DragHandleMenuItem: React.FC<DragHandleMenuItemProps> = ({ action, children, ...remainingProps }) => {
  const handleClick = () => {
    if (action) {
      action()
    }
  }

  return (
    <XStack
      {...remainingProps}
      onClick={handleClick}
      cursor="pointer"
      alignItems="center"
      gap="$2"
      hoverStyle={{
        backgroundColor: '$gray5',
        borderRadius: '$2',
      }}
      padding="$1"
      paddingLeft="$2"
    >
      {children}
    </XStack>
  )
}

export default DragHandleMenuItem
