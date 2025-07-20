import React, { useState, useEffect } from 'react'

import Switch from '@mui/material/Switch'
import posthog from 'posthog-js'

interface AnalyticsSettingsProps {}
const AnalyticsSettings: React.FC<AnalyticsSettingsProps> = () => {
  const [isAnalyticsEnabled, setIsAnalyticsEnabled] = useState<boolean>(false)

  useEffect(() => {
    const fetchParams = async () => {
      const storedIsAnalyticsEnabled = await window.electronStore.getAnalyticsMode()

      if (storedIsAnalyticsEnabled !== undefined) {
        setIsAnalyticsEnabled(storedIsAnalyticsEnabled)
      }
    }

    fetchParams()
  }, [])

  const handleSave = () => {
    // Execute the save function here
    if (isAnalyticsEnabled !== undefined) {
      window.electronStore.setAnalyticsMode(!isAnalyticsEnabled)
      setIsAnalyticsEnabled(!isAnalyticsEnabled)
      posthog.capture('analytics_disabled')
    }
  }

  return (
    <div className="w-full max-w-full bg-gray-50 px-4 dark:bg-gray-900">
      <h2 className="mb-0">Analytics</h2>
      <div className="w-full max-w-full overflow-hidden py-4">
        <div className="h-[2px] w-full bg-neutral-700" />
        <div>
          <div className="flex w-full items-center justify-between py-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Reor tracks anonymous usage data to help us understand how the app is used and which features are popular.
              You can disable this at any time:
            </p>
            <Switch checked={isAnalyticsEnabled} onChange={handleSave} inputProps={{ 'aria-label': 'controlled' }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsSettings
