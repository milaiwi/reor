import React from 'react'

import { useModalOpeners } from '@/contexts/ModalContext'
import SettingsModal from '../Settings/Settings'
import { useVault } from '../File/VaultManager/VaultContext'
import RenameNoteModal from '../File/RenameNote'
import RenameDirModal from '../File/RenameDirectory'
import NewDirectoryComponent from '../File/NewDirectory'

const CommonModals: React.FC = () => {
  const { isNewDirectoryModalOpen, setIsNewDirectoryModalOpen, isSettingsModalOpen, setIsSettingsModalOpen } =
    useModalOpeners()

  const { noteToBeRenamed, dirToBeRenamed } = useVault()

  return (
    <div>
      <NewDirectoryComponent isOpen={isNewDirectoryModalOpen} onClose={() => setIsNewDirectoryModalOpen(false)} />
      {noteToBeRenamed && <RenameNoteModal />}
      {dirToBeRenamed && <RenameDirModal />}
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} />
    </div>
  )
}

export default CommonModals
