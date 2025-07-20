import React, { createContext, useContext, useEffect, useState, PropsWithChildren, FC } from 'react'

// shadcn theme types
type Theme = "dark" | "light" | "system"

interface ThemeActions {
  toggle: () => void
  set: (theme: Theme) => void
  syncWithSystem: () => void
}

export interface ThemeContextValue {
  state: Theme
  actions: ThemeActions
}

// Basic colors for manual Mantine Component
const styles = {
  '#f9f9f9': {
    mainColor: 'rgba(255, 255, 255, 1)',
    offsetMainColor: 'rgba(255, 255, 255, 0.6)',
    textColor: 'rgba(0, 0, 0, 1)',
    systemGray1: 'rgb(142, 142, 147)',
    systemGray2: 'rgb(174, 174, 178)',
    systemGray3: 'rgb(199, 199, 204)',
    systemGray4: 'rgb(209, 209, 214)',
    systemGray5: 'rgb(229, 229, 234)',
    systemGray6: 'rgb(242, 242, 247)',
    systemBlue: 'rgb(0, 122, 255)',
    systemBlueHover: 'rgba(10, 132, 255, 1)',
  },
  '#151515': {
    mainColor: 'rgba(0, 0, 0, 1)',
    offsetMainColor: 'rgba(0, 0, 0, 0.6)',
    textColor: 'rgba(255, 255, 255, 1)',
    systemGray1: 'rgb(142, 142, 147)',
    systemGray2: 'rgb(99, 99, 102)',
    systemGray3: 'rgb(72, 72, 74)',
    systemGray4: 'rgb(58, 58, 60)',
    systemGray5: 'rgb(44, 44, 46)',
    systemGray6: 'rgb(28, 28, 30)',
    systemBlue: 'rgb(10, 132, 255)',
    systemBlueHover: 'rgba(0, 122, 255, 1)',
  },
}

/**
 * Some mantine components look / act better then tamagui. This converts
 * tamagui styles to mantine styles.
 */
export const MantineStyleProps = () => {
  // Get current theme from CSS classes
  const isDark = document.documentElement.classList.contains('dark')
  const themeKey = isDark ? '#151515' : '#f9f9f9'
  const colors = styles[themeKey]

  return {
    input: {
      backgroundColor: colors.mainColor,
      color: colors.textColor,
      '&:hover': {
        backgroundColor: colors.offsetMainColor,
      },
    },
    dropdown: {
      backgroundColor: colors.mainColor,
    },
    item: {
      color: colors.textColor,
      '&:hover': {
        backgroundColor: colors.systemBlueHover,
      },
    },
  }
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export class ThemeManager {
  private state: Theme
  private setState: (theme: Theme) => void

  constructor(initialTheme: Theme, setState: (theme: Theme) => void) {
    this.state = initialTheme
    this.setState = setState
  }

  private async updateTheme(newTheme: Theme) {
    this.state = newTheme
    this.setState(newTheme)
    
    // Store in electron store
    const electronTheme = newTheme === 'system' ? 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
      newTheme
    await window.electronStore.setTamaguiTheme(electronTheme)
    
    // Update localStorage
    localStorage.setItem('vite-ui-theme', newTheme)
    
    // Update CSS classes
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (newTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(newTheme)
    }
  }

  getContextValue(): ThemeContextValue {
    return {
      state: this.state,
      actions: {
        toggle: () => {
          const currentTheme = this.state === 'system' ? 
            (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
            this.state
          const newTheme = currentTheme === 'light' ? 'dark' : 'light'
          this.updateTheme(newTheme)
        },
        set: (theme: Theme) => {
          this.updateTheme(theme)
        },
        syncWithSystem: () => {
          this.updateTheme('system')
        },
      },
    }
  }
}

/**
 * Stores, gets, and updates the theme
 */
export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light')
  const [manager, setManager] = useState<ThemeManager | null>(null)

  useEffect(() => {
    const initTheme = async () => {
      // Try to get theme from localStorage first
      const savedTheme = localStorage.getItem('vite-ui-theme') as Theme
      
      if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
        setTheme(savedTheme)
        setManager(new ThemeManager(savedTheme, setTheme))
      } else {
        // Fallback to electron store
        const electronTheme = await window.electronStore.getTamaguiTheme()
        const defaultTheme = electronTheme === 'dark' ? 'dark' : 'light'
        setTheme(defaultTheme)
        setManager(new ThemeManager(defaultTheme, setTheme))
      }
    }

    initTheme()
  }, [])

  if (!manager) return null // Prevent rendering before the theme is set
  return (
    <ThemeContext.Provider value={manager.getContextValue()}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom hook for components to use
export const useThemeManager = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useThemeManager must be used within ThemeProvider')
  return context
}
