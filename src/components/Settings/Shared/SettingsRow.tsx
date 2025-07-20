import React, { ReactNode } from 'react'

interface SettingsSectionProps {
  title: string
  children: ReactNode
  footnote?: string | ReactNode
  error?: string | ReactNode
}

interface SettingsRowProps {
  title: string
  description?: string
  control: ReactNode
  divider?: boolean
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children, footnote, error }) => (
  <div className="flex h-full w-full flex-col justify-between bg-gray-50 px-4 dark:bg-gray-900">
    <div>
      <h2 className="mb-2">{title}</h2>
      <div className="h-[2px] w-full bg-neutral-700" />
      <div className="w-full max-w-full overflow-hidden">
        {children}
        {error && (
          <p className="py-2 text-sm text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
    {footnote && (
      <p className="py-2 text-sm text-gray-600 dark:text-gray-400">
        {footnote}
      </p>
    )}
  </div>
)

export const SettingsRow: React.FC<SettingsRowProps> = ({ title, description, control, divider = true }) => {
  return (
    <>
      <div className="w-full">
        <div className="flex w-full items-center justify-between py-3">
          <div className="flex-1 pr-4">
            <p className="text-base font-semibold text-gray-900 dark:text-white">
              {title}
            </p>
            {description && (
              <p className="py-2 text-sm text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {control}
        </div>
      </div>
      {divider && <div className="h-[2px] w-full bg-neutral-700" />}
    </>
  )
}

export default SettingsSection
