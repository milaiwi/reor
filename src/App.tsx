import React, { useEffect, useState } from 'react'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { VaultProvider, useVault } from './components/File/VaultManager/VaultContext'
import IndexingProgress from './components/Common/IndexingProgress'
import MainPageComponent from './components/MainPage'
import InitialSetupSinglePage from './components/Settings/InitialSettingsSinglePage'
import { ThemeProvider } from './contexts/ThemeContext'

import { Portal } from '@headlessui/react'
import posthog from 'posthog-js'

const AppContent = () => {
  const { isReady, error } = useVault()
  const [userHasConfiguredSettings, setUserHasConfiguredSettings] = useState<boolean | undefined>(
    undefined,
  )
  const [indexingProgress, setIndexingProgress] = useState<number>(0)

  useEffect(() => {
    // Listens for indexing progress update
    window.ipcRenderer.receive('indexing-progress', setIndexingProgress)
  
    window.ipcRenderer.receive('error-to-display-in-window', (error: string) => {
      toast.error(error, {
        className: 'mt-5',
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      })
      setIndexingProgress(1)
    })

    // Check if settings are configured
    const fetchSettings = async () => {
      const [initialDirectory, defaultEmbedFunc] = await Promise.all([
        window.electronStore.getVaultDirectoryForWindow(),
        window.electronStore.getDefaultEmbeddingModel(),
      ])
      setUserHasConfiguredSettings(!!(initialDirectory && defaultEmbedFunc))

      // Trigger indexing if configured
      if (initialDirectory && defaultEmbedFunc) {
        window.database.indexFilesInDirectory()
      }
    }

    fetchSettings()

    const initialisePosthog = async () => {
      if (await window.electronStore.getAnalyticsMode()) {
        posthog.init('phc_xi4hFToX1cZU657yzge1VW0XImaaRzuvnFUdbAKI8fu', {
          api_host: 'https://us.i.posthog.com',
          autocapture: false,
        })
        posthog.register({
          reorAppVersion: await window.electronUtils.getReorAppVersion(),
        })
      }
    }

    initialisePosthog()
  })

  const handleAllInitialSettingsAreReady = () => {
    window.database.indexFilesInDirectory()
  }

  /**
   * Content rendering based off of application state
   */
  if (!userHasConfiguredSettings && userHasConfiguredSettings !== undefined) {
    return <InitialSetupSinglePage readyForIndexing={handleAllInitialSettingsAreReady} />
  }

  if (userHasConfiguredSettings && indexingProgress >= 1 && isReady) {
    return <MainPageComponent />
  }

  // Load application progress
  return <IndexingProgress indexingProgress={indexingProgress} />
}


const App: React.FC = () => {
  return (
    <ThemeProvider>
      <VaultProvider>
        <div className="max-h-screen font-sans">
          <Portal>
            <ToastContainer
              theme="dark"
              position="bottom-right"
              autoClose={3000}
              hideProgressBar={false}
              closeOnClick
              pauseOnHover
              toastClassName="text-xs" // Added max height and overflow
            />{' '}
          </Portal>
          <AppContent />
        </div>
      </VaultProvider>
    </ThemeProvider>
  )
}

export default App
