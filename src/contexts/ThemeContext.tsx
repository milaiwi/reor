import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeContextType = {
  theme: string;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState('light')


  useEffect(() => {
    const fetchToggledTheme = async () => {
      const tempTheme = await window.electronStore.getToggledTheme()
      console.log(`Temp Theme: ${tempTheme}`)
      if (tempTheme !== undefined) {
        document.documentElement.setAttribute('data-theme', tempTheme)
        setTheme(tempTheme)
      }
    }

    fetchToggledTheme()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    console.log("Toggling theme and setting attribute")
    document.documentElement.setAttribute('data-theme', newTheme)
    console.log(`Setting theme to: ${newTheme}`)
    window.electronStore.setToggledTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context)
    throw new Error("useTheme must be used inside of a ThemeContext")
  return context
}
