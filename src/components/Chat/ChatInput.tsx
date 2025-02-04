import React from 'react'

import { PiPaperPlaneRight } from 'react-icons/pi'
import { AgentConfig, LoadingState } from '../../lib/llm/types'
import { Button } from '../ui/button'
import LLMSelectOrButton from '../Settings/LLMSettings/LLMSelectOrButton'
import { Label } from '@/components/ui/label'
import { TextArea, Switch } from 'tamagui'
import { useThemeManager } from '@/contexts/ThemeContext'

interface ChatInputProps {
  userTextFieldInput: string
  setUserTextFieldInput: (value: string) => void
  handleSubmitNewMessage: () => void
  loadingState: LoadingState
  selectedLLM: string | undefined
  setSelectedLLM: (value: string | undefined) => void
  agentConfig: AgentConfig | undefined
  setAgentConfig: React.Dispatch<React.SetStateAction<AgentConfig | undefined>>
}

const ChatInput: React.FC<ChatInputProps> = ({
  userTextFieldInput,
  setUserTextFieldInput,
  handleSubmitNewMessage,
  loadingState,
  selectedLLM,
  setSelectedLLM,
  agentConfig,
  setAgentConfig,
}) => {
  const { state, actions } = useThemeManager()

  const handleDbSearchToggle = (checked: boolean) => {
    setAgentConfig((prevConfig) => {
      if (!prevConfig) throw new Error('Agent config must be initialized before setting db search filters')
      return {
        ...prevConfig,
        dbSearchFilters: checked
          ? {
              limit: 22,
              minDate: undefined,
              maxDate: undefined,
              passFullNoteIntoContext: true,
            }
          : undefined,
      }
    })
  }

  return (
    <div className="flex w-full">
      <div className="z-50 flex w-full flex-col overflow-hidden rounded border-2">
        <TextArea
          value={userTextFieldInput}
          onKeyPress={(e) => {
            if (!e.shiftKey && e.key === 'Enter') {
              e.preventDefault()
              handleSubmitNewMessage()
            }
          }}
          placeholder="What can Reor help you with today?"
          onChangeText={(text: string) => setUserTextFieldInput(text)}
          autoFocus
          h={100}
          w="100%"
          resize="none"
          bg="transparent"
          p="$4"
          color="$foreground"
          borderWidth={2}
          caretColor="current"
          borderColor="$border"
          focusStyle={{
            outline: 'none',
            borderColor: '$ring',
            borderWidth: 2,
            ringWidth: 1,
          }}
          fontSize={12}
        />
        <div className="mx-auto h-px w-[96%] bg-background/20" />
        <div className="flex h-10 flex-col items-center justify-between gap-2  py-2 md:flex-row md:gap-4">
          <div className="flex flex-col items-center justify-between rounded-md border-0 py-2 md:flex-row">
            <LLMSelectOrButton selectedLLM={selectedLLM} setSelectedLLM={setSelectedLLM} />
          </div>

          <div className="flex items-center">
            <div className="mr-[-8px] flex flex-col">
              {/* <Switch
                id="search-notes"
                checked={!!agentConfig?.dbSearchFilters}
                onCheckedChange={handleDbSearchToggle}
                className="scale-[0.6]"
              /> */}
              <Switch
                id="search-notes"
                size="$1"
                checked={!!agentConfig?.dbSearchFilters}
                onCheckedChange={handleDbSearchToggle}
                backgroundColor="$gray6" // Default background color
              >
                <Switch.Thumb animation="unset" backgroundColor="$blue9" width={20} />
              </Switch>
              <Label htmlFor="stream-mode" className="mt-0 text-[8px] text-muted-foreground">
                Search notes
              </Label>
            </div>

            <Button
              className="flex items-center justify-between bg-transparent text-[10px] text-primary hover:bg-transparent hover:text-accent-foreground"
              onClick={handleSubmitNewMessage}
              disabled={loadingState !== 'idle'}
            >
              <PiPaperPlaneRight className="size-4" color={state === 'light' ? 'black' : 'white'} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput
