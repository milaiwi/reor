import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog'

import AnalyticsSettings from './AnalyticsSettings'
import EmbeddingModelSettings from './EmbeddingSettings/EmbeddingSettings'
import EditorSettings from './GeneralSettings'

import LLMSettingsContent from './LLMSettings/LLMSettingsContent'

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
      <DialogOverlay>
        <DialogContent>
          <div className="h-[80vh] overflow-y-auto">
            <div className="flex h-full min-h-[80vh] w-full">
              <div className="flex w-[150px] flex-1 flex-col rounded-l-lg border-r border-solid border-gray-700 bg-gray-800 p-2 text-white">
                <div
                  className={`cursor-pointer rounded py-2 px-2 text-left hover:bg-gray-700 ${
                    activeTab === SettingsTab.GeneralSettingsTab ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setActiveTab(SettingsTab.GeneralSettingsTab)}
                >
                  <p
                    className={`text-sm ${
                      activeTab === SettingsTab.GeneralSettingsTab ? 'font-bold text-gray-100' : 'text-gray-300'
                    }`}
                  >
                    Editor
                  </p>
                </div>
                <div
                  className={`cursor-pointer rounded py-2 px-2 text-left hover:bg-gray-700 ${
                    activeTab === SettingsTab.LLMSettingsTab ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setActiveTab(SettingsTab.LLMSettingsTab)}
                >
                  <p
                    className={`text-sm ${
                      activeTab === SettingsTab.LLMSettingsTab ? 'font-bold text-gray-100' : 'text-gray-300'
                    }`}
                  >
                    LLM
                  </p>
                </div>
                <div
                  className={`cursor-pointer rounded py-2 px-2 text-left hover:bg-gray-700 ${
                    activeTab === SettingsTab.EmbeddingModelTab ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setActiveTab(SettingsTab.EmbeddingModelTab)}
                >
                  <p
                    className={`text-sm ${
                      activeTab === SettingsTab.EmbeddingModelTab ? 'font-bold text-gray-100' : 'text-gray-300'
                    }`}
                  >
                    Embedding Model
                  </p>
                </div>
                <div
                  className={`cursor-pointer rounded py-2 px-2 text-left hover:bg-gray-700 ${
                    activeTab === SettingsTab.AnalyticsTab ? 'bg-gray-700' : ''
                  }`}
                  onClick={() => setActiveTab(SettingsTab.AnalyticsTab)}
                >
                  <p
                    className={`text-sm ${
                      activeTab === SettingsTab.AnalyticsTab ? 'font-bold text-gray-100' : 'text-gray-300'
                    }`}
                  >
                    Analytics
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-[calc(100%-150px)]">
                {activeTab === SettingsTab.GeneralSettingsTab && <EditorSettings />}
                {activeTab === SettingsTab.LLMSettingsTab && <LLMSettingsContent />}
                {activeTab === SettingsTab.EmbeddingModelTab && (
                  <EmbeddingModelSettings handleUserHasChangedModel={() => setWillNeedToReIndex(true)} />
                )}
                {activeTab === SettingsTab.AnalyticsTab && <AnalyticsSettings />}
              </div>
            </div>
          </div>
        </DialogContent>
      </DialogOverlay>
    </Dialog>
  )
}

export default SettingsModal
