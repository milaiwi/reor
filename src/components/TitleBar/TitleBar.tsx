import React, { useEffect, useState } from 'react'
import NavigationButtons from './NavigationButtons'
import ExternalLink from '../Common/ExternalLink'
import { useChatContext } from '@/contexts/ChatContext'
import { LuPanelLeftClose, LuPanelLeftInactive } from "react-icons/lu";
import { VscFeedback } from "react-icons/vsc";

export const titleBarHeight = '30px'

const TitleBar: React.FC = () => {
  const { showChatbot, setShowChatbot } = useChatContext()
  const [platform, setPlatform] = useState('')

  useEffect(() => {
    const fetchPlatform = async () => {
      const response = await window.electronUtils.getPlatform()
      setPlatform(response)
    }

    fetchPlatform()
  }, [])

  return (
    <div className="electron-drag flex justify-between bg-editor-four">
      <div className="mt-px flex" style={platform === 'darwin' ? { marginLeft: '65px' } : { marginLeft: '2px' }}>
        <NavigationButtons />
      </div>

      <div
        className="electron-no-drag mt-[0.5px] flex items-center justify-end"
        style={platform === 'win32' ? { marginRight: '8.5rem' } : { marginRight: '0.3rem' }}
      >
        <ExternalLink href="https://forms.gle/8H4GtEcE6MBnNAUa7" 
          className="decoration-gray-200 cursor-pointer mr-3 mt-1 text-gray-400">
          <VscFeedback size={20} />
        </ExternalLink>

        {showChatbot ? (
          <LuPanelLeftInactive
            className="electron-no-drag mr-1 mt-[0.2rem] -scale-x-100 cursor-pointer p-[2px] text-gray-400"
            size={24}
            title="Hide Similar Files"
            onClick={() => setShowChatbot((show) => !show)}
          />
        ) : (
          <LuPanelLeftClose
            className="electron-no-drag mr-1 mt-[0.2rem] -scale-x-100 cursor-pointer p-[2px] text-gray-400"
            size={24}
            title="Show Chatbot"
            onClick={() => setShowChatbot((show) => !show)}
          />
        )}
      </div>
    </div>
  )
}

export default TitleBar
