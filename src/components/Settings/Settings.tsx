import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'

import AnalyticsSettings from './AnalyticsSettings'
import EmbeddingModelSettings from './EmbeddingSettings/EmbeddingSettings'
import GeneralSettings from './GeneralSettings'

import LLMSettingsContent from './LLMSettings/LLMSettingsContent'
import { YStack, SizableText, XStack, ScrollView } from 'tamagui'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  initialTab?: SettingsTab
}

export enum SettingsTab {
  GeneralSettingsTab = 'generalSettings',
  LLMSettingsTab = 'llmSettings',
  EmbeddingModelTab = 'embeddingModel',
  AnalyticsTab = 'analytics',
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose: onCloseFromParent,
  initialTab = SettingsTab.GeneralSettingsTab,
}) => {
  const [willNeedToReIndex, setWillNeedToReIndex] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab)

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  const handleSave = () => {
    if (willNeedToReIndex) {
      window.database.indexFilesInDirectory()
    }
    onCloseFromParent()
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleSave()
      }}
    >
      <DialogContent className="border-none bg-transparent p-0 [&>button]:hidden">
        <ScrollView>
          <XStack 
            height="80vh"
            width='100%'
            maxWidth='70vw'
            overflow="hidden"
            >
            <YStack 
              backgroundColor="$gray12"
              width="150px"
              className="flex flex-col rounded-l-lg border-y-0 border-l-0 border-r-[0.1px] border-solid border-gray-700 p-2 text-white">
              <YStack
                backgroundColor={activeTab === SettingsTab.GeneralSettingsTab ? '$gray7' : ''}
                color={activeTab === SettingsTab.GeneralSettingsTab ? '$gray13' : ''}
                hoverStyle={{
                  backgroundColor: '$gray7',
                  backgroundFocus: '$gray8',
                }}
                cursor='pointer'
                py="$2"
                px="$2"
                alignItems="left"
                borderBottomWidth="$1"
                borderBottomColor="$gray4"
                borderBottomStyle="solid"
                onPress={() => setActiveTab(SettingsTab.GeneralSettingsTab)}
              >
                <SizableText
                  size="$2"
                  fontWeight={activeTab === SettingsTab.GeneralSettingsTab ? 'bold' : 'normal'}
                >
                  Editor
                </SizableText>
              </YStack>
              <YStack
                backgroundColor={activeTab === SettingsTab.LLMSettingsTab ? '$gray7' : ''}
                color={activeTab === SettingsTab.LLMSettingsTab ? '$gray13' : ''}
                hoverStyle={{
                  backgroundColor: '$gray7',
                  backgroundFocus: '$gray8',
                }}
                cursor='pointer'
                py="$2"
                px="$2"
                alignItems="left"
                borderRadius="$2"
                borderBottomWidth="$1"
                borderBottomColor="$gray4"
                borderBottomStyle="solid"
                onPress={() => setActiveTab(SettingsTab.LLMSettingsTab)}
              >
                <SizableText
                  size="$2"
                  fontWeight={activeTab === SettingsTab.LLMSettingsTab ? 'bold' : 'normal'}
                >
                  LLM
                </SizableText>
              </YStack>
              <YStack
                backgroundColor={activeTab === SettingsTab.EmbeddingModelTab ? '$gray7' : ''}
                color={activeTab === SettingsTab.EmbeddingModelTab ? '$gray13' : ''}
                hoverStyle={{
                  backgroundColor: '$gray7',
                  backgroundFocus: '$gray8',
                }}
                cursor='pointer'
                py="$2"
                px="$2"
                alignItems="left"
                borderRadius="$2"
                borderBottomWidth="$1"
                borderBottomColor="$gray4"
                borderBottomStyle="solid"
                onPress={() => setActiveTab(SettingsTab.EmbeddingModelTab)}
              >
                <SizableText
                  size="$2"
                  fontWeight={activeTab === SettingsTab.EmbeddingModelTab ? 'bold' : 'normal'}
                >
                  Embedding Model
                </SizableText>
              </YStack>
              <YStack
                backgroundColor={activeTab === SettingsTab.AnalyticsTab ? '$gray7' : ''}
                color={activeTab === SettingsTab.AnalyticsTab ? '$gray13' : ''}
                hoverStyle={{
                  backgroundColor: '$gray7',
                  backgroundFocus: '$gray8',
                }}
                cursor='pointer'
                py="$2"
                px="$2"
                alignItems="left"
                borderRadius="$2"
                borderBottomWidth="$1"
                borderBottomColor="$gray4"
                borderBottomStyle="solid"
                onPress={() => setActiveTab(SettingsTab.AnalyticsTab)}
              >
                <SizableText
                  size="$2"
                  fontWeight={activeTab === SettingsTab.AnalyticsTab ? 'bold' : 'normal'}
                >
                  Analytics
                </SizableText>
              </YStack>
            </YStack>

            <XStack
              maxWidth="calc(100% - 150px)"
            >
              {activeTab === SettingsTab.GeneralSettingsTab && <GeneralSettings />}
              {activeTab === SettingsTab.LLMSettingsTab && <LLMSettingsContent />}
              {activeTab === SettingsTab.EmbeddingModelTab && (
                <EmbeddingModelSettings handleUserHasChangedModel={() => setWillNeedToReIndex(true)} />
              )}
              {activeTab === SettingsTab.AnalyticsTab && <AnalyticsSettings />}
            </XStack>
          </XStack>
        </ScrollView>
      </DialogContent>
    </Dialog>
  )
}

export default SettingsModal
