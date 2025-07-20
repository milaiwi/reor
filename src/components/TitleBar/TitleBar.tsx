import React, { useEffect, useState } from 'react'
import { MessageSquareMore, MessageSquareOff, PanelRightOpen, PanelRightClose } from 'lucide-react'
import NavigationButtons from './NavigationButtons'
import ExternalLink from '../Common/ExternalLink'

export const titleBarHeight = '30px'

interface TitleBarProps {
  activePanel: 'chat' | 'similarFiles' | null
  togglePanel: (panel: 'chat' | 'similarFiles' | null) => void
}

const TitleBar: React.FC<TitleBarProps> = ({ activePanel, togglePanel }) => {
  const [platform, setPlatform] = useState('')

  useEffect(() => {
    const fetchPlatform = async () => {
      const response = await window.electronUtils.getPlatform()
      setPlatform(response)
    }

    fetchPlatform()
  }, [])

  return (
    <div className="electron-drag flex items-center justify-between bg-[#303030]">
      <div 
        className="mt-px flex" 
        style={platform === 'darwin' ? { marginLeft: '65px' } : { marginLeft: '2px' }}
      >
        <NavigationButtons />
      </div>

      <div 
        className="electron-no-drag flex items-center justify-end"
        style={platform === 'win32' ? { marginRight: '8.5rem' } : { marginRight: '0.3rem' }}
      >
        <ExternalLink href="https://forms.gle/8H4GtEcE6MBnNAUa7" className="mr-4 cursor-pointer">
          <span className="mr-4 text-sm text-gray-400">Feedback</span>
        </ExternalLink>
        <div
          className="flex cursor-pointer items-center px-2 py-1 hover:bg-gray-700"
          onClick={() => togglePanel('chat')}
        >
          {activePanel === 'chat' ? (
            <div title="Hide Chatbot">
              <MessageSquareOff size={16} className="text-gray-400" />
            </div>
          ) : (
            <div title="Show Chatbot">
              <MessageSquareMore size={16} className="text-gray-400" />
            </div>
          )}
        </div>
        <div
          className="ml-3 flex cursor-pointer items-center px-2 py-1 hover:bg-gray-700"
          onClick={() => togglePanel('similarFiles')}
        >
          {activePanel === 'similarFiles' ? (
            <div title="Hide Similar Files">
              <PanelRightClose size={16} className="text-gray-400" />
            </div>
          ) : (
            <div title="Show Similar Files">
              <PanelRightOpen size={16} className="text-gray-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TitleBar
