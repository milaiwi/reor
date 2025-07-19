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
  // Hook-based operations for reactive components
  useReadFile: (path: string) => ReadFileResult
  useWriteFile: () => WriteFileResult
  
  // Direct operations for programmatic use
  readFileDirect: (path: string) => Promise<string | null>
  writeFileDirect: (path: string, content: string) => Promise<void>
  
  // Cache management
  invalidateFile: (path: string) => void
  prefetchFile: (path: string) => Promise<void>
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
    enabled: !!path, // Only run query if path is provided
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

// Custom hook for components that need reactive file reading
export const useReactiveFile = (path: string | null) => {
  const { useReadFile } = useFileCache()
  
  if (!path) {
    return { isPending: false, error: null, data: undefined }
  }
  
  return useReadFile(path)
}

// Custom hook for components that need reactive file writing
export const useReactiveFileWrite = () => {
  const { useWriteFile } = useFileCache()
  return useWriteFile()
}

const FileCacheProvider: React.FC<{ children: React.ReactNode, queryClient: QueryClient }> = ({ children, queryClient }) => {
  // Direct file operations that don't use hooks
  const readFileDirect = async (path: string): Promise<string | null> => {
    try {
      return await window.fileSystem.readFile(path, 'utf-8')
    } catch (error) {
      console.error('Error reading file:', error)
      return null
    }
  }

  const writeFileDirect = async (path: string, content: string): Promise<void> => {
    try {
      await window.fileSystem.writeFile({
        filePath: path,
        content,
      })
      // Invalidate the cache after writing
      queryClient.invalidateQueries({ queryKey: ['file', path] })
    } catch (error) {
      console.error('Error writing file:', error)
      throw error
    }
  }

  const invalidateFile = (path: string): void => {
    queryClient.invalidateQueries({ queryKey: ['file', path] })
  }

  const prefetchFile = async (path: string): Promise<void> => {
    await queryClient.prefetchQuery({
      queryKey: ['file', path],
      queryFn: async () => {
        const fileContent = await window.fileSystem.readFile(path, 'utf-8')
        return fileContent
      },
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
    })
  }

  const value = useMemo(() => ({
    useReadFile,
    useWriteFile,
    readFileDirect,
    writeFileDirect,
    invalidateFile,
    prefetchFile,
  }), [queryClient])

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
