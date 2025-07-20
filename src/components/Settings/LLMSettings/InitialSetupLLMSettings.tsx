import React from 'react'
import { CheckCircleIcon, CogIcon } from '@heroicons/react/24/solid'
import { Button } from '@material-tailwind/react'
import useLLMConfigs from '../../../lib/hooks/use-llm-configs'
import LLMSettingsContent from './LLMSettingsContent'
import { Dialog, DialogContent, DialogTrigger, DialogOverlay } from '@/components/ui/dialog'

interface InitialSetupLLMSettingsProps {}

const InitialSetupLLMSettings: React.FC<InitialSetupLLMSettingsProps> = () => {
  const [isSetupModalOpen, setIsSetupModalOpen] = React.useState<boolean>(false)
  const { llmConfigs, fetchAndUpdateModelConfigs } = useLLMConfigs()

  const isSetupComplete = llmConfigs.length > 0

  const handleOpenChange = (open: boolean) => {
    setIsSetupModalOpen(open)
    if (!open) {
      fetchAndUpdateModelConfigs()
    }
  }

  return (
    <div className="flex w-full items-center justify-between pt-2">
      <h3 className="font-semibold text-gray-900 dark:text-white">
        LLM
      </h3>
      <Dialog open={isSetupModalOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            className={`flex cursor-pointer items-center justify-between rounded-md border border-none border-gray-300 px-3 py-2 ${
              isSetupComplete
                ? 'bg-green-700 text-white hover:bg-green-800'
                : 'bg-dark-gray-c-eight hover:bg-dark-gray-c-ten'
            } font-normal transition-colors duration-200`}
            placeholder=""
          >
            {isSetupComplete ? (
              <>
                <CheckCircleIcon className="mr-2 size-5" />
                <span>Setup</span>
              </>
            ) : (
              <>
                <CogIcon className="mr-2 size-5" />
                <span>Setup</span>
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogOverlay>
          <DialogContent style={{ maxHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-1 overflow-y-auto">
              <LLMSettingsContent />
            </div>
          </DialogContent>
        </DialogOverlay>
      </Dialog>
    </div>
  )
}

export default InitialSetupLLMSettings
