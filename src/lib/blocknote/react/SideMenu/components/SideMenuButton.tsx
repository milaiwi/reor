import React from 'react'

const SideMenuButton = (props: { children: JSX.Element }) => (
  <div
    className="cursor-pointer p-1 hover:bg-gray-500 hover:rounded-md transition-colors"
  >
    {props.children}
  </div>
)

export default SideMenuButton
