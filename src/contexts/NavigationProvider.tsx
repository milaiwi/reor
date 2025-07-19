import React, { createContext, useContext, ReactNode, useState } from 'react'
import useOrderedSet from '../lib/hooks/use-ordered-set'

type NavigationContextType = {
  // Navigation history
  navigationHistory: string[]
  addToNavigationHistory: (value: string) => void
  removeFromNavigationHistory: (value: string) => void
  
  // File selection
  selectedDirectory: string | null
  setSelectedDirectory: React.Dispatch<React.SetStateAction<string | null>>
  
  // Rename state
  noteToBeRenamed: string
  setNoteToBeRenamed: React.Dispatch<React.SetStateAction<string>>
  fileDirToBeRenamed: string
  setFileDirToBeRenamed: React.Dispatch<React.SetStateAction<string>>
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

export const NavigationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null)
  const [noteToBeRenamed, setNoteToBeRenamed] = useState<string>('')
  const [fileDirToBeRenamed, setFileDirToBeRenamed] = useState<string>('')

  const {
    add: addToNavigationHistory,
    remove: removeFromNavigationHistory,
    values: navigationHistory,
  } = useOrderedSet()

  const contextValue: NavigationContextType = {
    navigationHistory,
    addToNavigationHistory,
    removeFromNavigationHistory,
    selectedDirectory,
    setSelectedDirectory,
    noteToBeRenamed,
    setNoteToBeRenamed,
    fileDirToBeRenamed,
    setFileDirToBeRenamed,
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {children}
    </NavigationContext.Provider>
  )
} 