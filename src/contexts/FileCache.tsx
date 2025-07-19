// src/contexts/FileCache.tsx
import React, { useContext, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query'

type ReadFileResult = {
  isPending: boolean
  error: Error | null
  data?: string
}

type WriteFileResult = {
  mutate: (variables: { path: string; content: string }) => void
  isPending: boolean
  error: Error | null
}

interface FileCacheContextType {
  useReadFile: (path: string) => ReadFileResult
  useWriteFile: () => WriteFileResult
}

const FileCacheContext = React.createContext<FileCacheContextType | undefined>(undefined)

// ✅ Move hook definitions to top-level
const useReadFile = (path: string): ReadFileResult => {
  const { isPending, error, data } = useQuery({
    queryKey: ['file', path],
    queryFn: async () => {
      const fileContent = await window.fileSystem.readFile(path, 'utf-8')
      return fileContent
    },
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  })

  return { isPending, error, data }
}

const useWriteFile = (): WriteFileResult => {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: async ({ path, content }: { path: string; content: string }) => {
      await window.fileSystem.writeFile({
        filePath: path,
        content,
      })
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['file', variables.path] })
    },
  })

  return { mutate, isPending, error }
}

const FileCacheProvider: React.FC<{ children: React.ReactNode, queryClient: QueryClient }> = ({ children, queryClient }) => {
  const value = useMemo(() => ({
    useReadFile,
    useWriteFile,
  }), [])

  return (
    <FileCacheContext.Provider value={value}>
      {children}
    </FileCacheContext.Provider>
  )
}

export const useFileCache = () => {
  const context = useContext(FileCacheContext)
  if (!context) {
    throw new Error('useFileCache must be used within a FileCacheProvider')
  }
  return context
}

export default FileCacheProvider
