import React, { useRef } from 'react'
import ReactDOM from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  hideCloseButton?: boolean
}

const ReorModal: React.FC<ModalProps> = ({ isOpen, onClose, children, hideCloseButton }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  if (!isOpen) {
    return null
  }

  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose()
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="rounded-lg border border-gray-700 bg-white p-4 shadow-lg dark:bg-gray-800"
        onClick={(e) => e.stopPropagation()}
      >
        {!hideCloseButton && (
          <div className="absolute right-4 top-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="bg-transparent border-none text-2xl cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  )

  return ReactDOM.createPortal(modalContent, document.body)
}

export default ReorModal
