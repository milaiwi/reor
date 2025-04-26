import React, { useEffect, useState } from 'react'
import { XStack, SizableText, Tooltip } from 'tamagui'
import { MessageSquareMore, MessageSquareOff, PanelRightOpen, PanelRightClose, UserCog } from '@tamagui/lucide-icons'
import NavigationButtons from './NavigationButtons'
import ExternalLink from '../Common/ExternalLink'
import { useContentContext } from '../../contexts/ContentContext'
import { useFileContext } from '@/contexts/FileContext'

export const titleBarHeight = '30px'

interface TitleBarProps {
  activePanel: 'chat' | 'similarFiles' | null
  togglePanel: (show: 'chat' | 'similarFiles' | null) => void
}

const TitleBar: React.FC<TitleBarProps> = ({ activePanel, togglePanel }) => {
  const [platform, setPlatform] = useState('')
  const { showEditor } = useContentContext()
  const { editor } = useFileContext()

  useEffect(() => {
    const fetchPlatform = async () => {
      const response = await window.electronUtils.getPlatform()
      setPlatform(response)
    }

    fetchPlatform()
  }, [])

  return (
    <XStack 
      position="relative"
      alignItems="center"
      backgroundColor="$gray3"
      className="electron-drag flex justify-between bg-[#303030]"
      height={30}
      padding={1}>
      <XStack
        className="electron-no-drag"
        position="absolute"
        left={platform === 'darwin' ? '65px' : '2px'}
        alignItems='center'
      >
        <NavigationButtons />
        {showEditor && (
          <Tooltip
            delay={{ open: 300, close: 100 }}
            placement='bottom'
          >
            <Tooltip.Trigger>
              <UserCog 
                size={22}
                title="Settings"
                color="$gray11"
                cursor="pointer"
                padding={1} 
                onClick={() => (
                  console.log('Editor blocks: ', editor?.topLevelBlocks)
                )}
              />
            </Tooltip.Trigger>
            <Tooltip.Content 
              enterStyle={{ x: 0, y: -5, opacity: 1, scale: 0.9 }}
              exitStyle={{ x: 0, y: -5, opacity: 0, scale: 0.9 }}
              scale={1}
              x={0}
              y={0}
              opacity={1}
              py="$1"
            >
              <SizableText fontSize={12} color="$gray11">
                Auto-Link Notes
              </SizableText>
            </Tooltip.Content>
            <Tooltip.Arrow className="bg-gray-800" />
          </Tooltip>
        )}
      </XStack>

      <XStack
        // className="electron-no-drag flex items-center justify-end"
        className="electron-no-drag"
        position="absolute"
        right={0}
        style={platform === 'win32' ? { marginRight: '8.5rem' } : { marginRight: '0.3rem' }}
      >
        <ExternalLink href="https://forms.gle/8H4GtEcE6MBnNAUa7" className="mr-4 cursor-pointer">
          <SizableText color="$gray11" fontSize={14} className="mr-4">
            Feedback
          </SizableText>
        </ExternalLink>
        <XStack onPress={() => togglePanel('chat')}>
          {activePanel !== 'chat' ? (
            <MessageSquareMore size={22} title="Show Chatbot" color="$gray11" cursor="pointer" />
          ) : (
            <MessageSquareOff size={22} title="Hide Similar Files" color="$gray11" cursor="pointer" />
          )}
        </XStack>
        <XStack marginLeft={3} onPress={() => togglePanel('similarFiles')}>
          {activePanel !== 'similarFiles' ? (
            <PanelRightOpen size={22} title="Show Similar Files" color="$gray11" cursor="pointer" />
          ) : (
            <PanelRightClose size={22} title="Hide Similar Files" color="$gray11" cursor="pointer" />
          )}
        </XStack>
      </XStack>
    </XStack>
  )
}

export default TitleBar
