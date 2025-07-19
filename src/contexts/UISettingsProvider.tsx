import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { SuggestionsState } from '@/components/Editor/BacklinkSuggestionsDisplay'
import { HighlightData } from '@/components/Editor/HighlightExtension'

type UISettingsContextType = {
  // Spell check
  spellCheckEnabled: boolean
  setSpellCheckEnabled: React.Dispatch<React.SetStateAction<boolean>>
  
  // Editor suggestions
  suggestionsState: SuggestionsState | null | undefined
  setSuggestionsState: React.Dispatch<React.SetStateAction<SuggestionsState | null | undefined>>
  
  // Highlighting
  highlightData: HighlightData
  setHighlightData: React.Dispatch<React.SetStateAction<HighlightData>>
}

const UISettingsContext = createContext<UISettingsContextType | undefined>(undefined)

export const useUISettings = () => {
  const context = useContext(UISettingsContext)
  if (context === undefined) {
    throw new Error('useUISettings must be used within a UISettingsProvider')
  }
  return context
}

export const UISettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [spellCheckEnabled, setSpellCheckEnabled] = useState<boolean>(false)
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState | null>()
  const [highlightData, setHighlightData] = useState<HighlightData>({
    text: '',
    position: null,
  })

  // Load spell check setting from storage
  useEffect(() => {
    const fetchSpellCheckMode = async () => {
      const storedSpellCheckEnabled = await window.electronStore.getSpellCheckMode()
      setSpellCheckEnabled(storedSpellCheckEnabled)
    }
    fetchSpellCheckMode()
  }, [])

  const contextValue: UISettingsContextType = {
    spellCheckEnabled,
    setSpellCheckEnabled,
    suggestionsState,
    setSuggestionsState,
    highlightData,
    setHighlightData,
  }

  return (
    <UISettingsContext.Provider value={contextValue}>
      {children}
    </UISettingsContext.Provider>
  )
} 