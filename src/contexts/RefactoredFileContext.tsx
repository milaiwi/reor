// /* eslint-disable react-hooks/exhaustive-deps */
// /* eslint-disable @typescript-eslint/no-use-before-define */
// import { BlockNoteEditor } from '@/lib/blocknote'
// import React, { createContext, useContext, ReactNode } from 'react'
// import { useBlockNote } from '@/lib/blocknote'

// interface FileContextType {
//   openFile: (filePath: string) => Promise<void>
//   saveFile: () => Promise<void>
//   deleteFile: (filePath: string) => Promise<void>
//   renameFile: (oldPath: string, newPath: string) => Promise<void>
//   currentlyOpenFilePath: string | null
//   setCurrentlyOpenFilePath: (path: string | null) => void
//   editor: BlockNoteEditor
// }

// export const RefactoredFileContext = createContext< | undefined>(undefined)

// export const useRefactoredFileContext = () => {
//   const context = useContext(RefactoredFileContext)
//   if (context === undefined) {
//     throw new Error('useRefactoredContext must be used within a FileProvider')
//   }
//   return context
// }

// export const RefactoredFileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
//   // Editor manager -> useBlockNote

//   const { readFile, writeFile, renameFile, deleteFile } = useFile
// }