import React, { ReactNode } from 'react'
import { Menu, MenuProps, MenuLabelProps, MenuDropdownProps } from '@mantine/core'
import { useThemeManager } from '@/contexts/ThemeContext'

interface ThemedMenuProps {
  children: ReactNode
}

type ThemedMenuItemProps<C extends React.ElementType = 'button'> = {
  style?: React.CSSProperties
  icon?: React.ReactNode
} & React.ComponentPropsWithoutRef<C>

const ThemedMenu: React.FC<ThemedMenuProps & MenuProps> = ({ children, ...restProps }) => {
  const { state } = useThemeManager()
  const isDark = state === 'dark' || (state === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  const backgroundColor = isDark ? '#151515' : '#f9f9f9'

  return (
    <Menu {...restProps} styles={{ dropdown: { backgroundColor } }}>
      {children}
    </Menu>
  )
}

export const ThemedMenuItem: React.FC<ThemedMenuItemProps> = <C extends React.ElementType = 'button'>({
  style,
  ...props
}: ThemedMenuItemProps<C>) => {
  const { state } = useThemeManager()
  const isDark = state === 'dark' || (state === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  const backgroundColor = isDark ? '#151515' : '#f9f9f9'
  const color = isDark ? '#ffffff' : '#000000'
  const hoverBackgroundColor = isDark ? 'rgba(10, 132, 255, 1)' : 'hsl(0, 0%, 93.3%)'

  return (
    <Menu.Item
      {...props}
      style={{
        backgroundColor,
        color,
        ...style,
      }}
      onMouseEnter={(e: any) => {
        e.currentTarget.style.backgroundColor = hoverBackgroundColor
      }}
      onMouseLeave={(e: any) => {
        e.currentTarget.style.backgroundColor = backgroundColor
      }}
    />
  )
}

export const ThemedLabel: React.FC<ThemedMenuProps & MenuLabelProps> = ({ children, ...restProps }) => {
  const { state } = useThemeManager()
  const isDark = state === 'dark' || (state === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  const backgroundColor = isDark ? '#151515' : '#f9f9f9'
  const color = isDark ? '#ffffff' : '#000000'

  return (
    <Menu.Label
      {...restProps}
      style={{
        backgroundColor,
        color,
      }}
    >
      {children}
    </Menu.Label>
  )
}

export const ThemedDropdown: React.FC<ThemedMenuProps & MenuDropdownProps> = ({ children, ...restProps }) => {
  const { state } = useThemeManager()
  const isDark = state === 'dark' || (state === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  
  const backgroundColor = isDark ? '#151515' : '#f9f9f9'
  const color = isDark ? '#ffffff' : '#000000'

  return (
    <Menu.Dropdown
      {...restProps}
      style={{
        backgroundColor,
        color,
      }}
    >
      {children}
    </Menu.Dropdown>
  )
}

export default ThemedMenu
