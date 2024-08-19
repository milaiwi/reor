import React, { ReactNode, useState } from 'react'


export interface MenuChildItems {
    name: string
    separator?: { top?: boolean; bottom?: boolean }
    icon?: ReactNode
    tooltip?: string
    onSelect: (args: T) => void
}

interface MenuPosition {
  x: number
  y: number
}

interface ContextMenuProps {
  position: MenuPosition
  items: MenuChildItems[]
  onClose: () => void
}


const CustomContextMenu: React.FC<ContextMenuProps> = ({ position, items, onClose }) => {
  console.log("Showing custom context menu at:", JSON.stringify(position))
  return (
    <div
      className={`flex flex-col gap-1 absolute bg-[#2c2c2e] py-2 rounded-lg shadow-lg z-[1000] cursor-pointer px-1 border border-solid border-[rgba(255,255,255,0.1)]`}
      style={{
        top: position.y,
        left: position.x,
      }}
      onClick={onClose}
    >
      {items && items.map((item, index) => (
        <div
          key={index}
          onClick={() => {
            item.onSelect()
            onClose()
          }}
          className={`flex justify-between items-center px-3 py-1 text-[11px] text-white hover:bg-[#0a84ff] rounded-md`}
        >
          {item.name}
        </div>
      ))}
    </div>
  );  
}

/**
 * 
 *    Maintains an internal state to store x and y position to display the Menu
 *    
 *    How to use:
 *      - Pass handleContextMenu from MainPage to the component.
 *      - The component should create a list of Items with type MenuChildItems
 *          and then pass to handleContextMenu
 * 
 */
export const useCustomMenu = () => {
    const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
    const [menuVisible, setMenuVisible] = useState<boolean>(false)
    const [menuItems, setMenuItems] = useState<MenuChildItems[]>([])

    const handleContextMenu = (e: any, items: MenuChildItems[]) => {
      e.preventDefault()
      setMenuPosition({ x: e.pageX, y: e.pageY })
      setMenuItems(items)
      setMenuVisible(true)
    }

    const handleCloseMenu = (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      setMenuVisible(false)
    }

    return {
      menuVisible,
      menuPosition,
      menuItems,
      handleContextMenu,
      handleCloseMenu, 
    }
}


export default CustomContextMenu
