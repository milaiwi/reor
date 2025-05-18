import { jest } from '@jest/globals'
import FileStateManager from './FileStateManager'
import FileSystemService from '../FileSystemService/FileSystemService'
import { FileInfo, FileState } from 'electron/main/filesystem/types'

describe('FileStateManager', () => {
  let fileStateManager: FileStateManager
  let mockFileSystem: any
  let fsService: FileSystemService
  const mockFileInfo: FileInfo = {
    name: 'test.txt',
    path: '/test.txt',
    relativePath: 'test.txt',
    dateModified: new Date(),
    dateCreated: new Date()
  }

  beforeEach(() => {
    jest.resetAllMocks()
    
    mockFileSystem = {
      readFile: jest.fn<(filePath: string, encoding: string) => Promise<string>>(),
      writeFile: jest.fn<(props: { filePath: string; content: string }) => Promise<void>>()
    }
    
    // @ts-ignore - Mocking window for tests
    global.window = {
      fileSystem: mockFileSystem
    }
    
    fsService = new FileSystemService()
    fileStateManager = new FileStateManager([mockFileInfo])
  })

  describe('Initialization', () => {
    it('should initialize with clean state', () => {
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state).toBeDefined()
      expect(state?.status).toBe('clean')
      expect(state?.file).toEqual(mockFileInfo)
    })
  })

  describe('Path Management', () => {
    it('should update path correctly', () => {
      const newPath = 'new/path/test.txt'
      fileStateManager.updatePath(mockFileInfo.name, newPath)
      
      const oldState = fileStateManager.getFileState(mockFileInfo.name)
      const newState = fileStateManager.getFileState(newPath)
      
      expect(oldState).toBeUndefined()
      expect(newState).toBeDefined()
      expect(newState?.file.path).toBe(newPath)
    })

    it('should not update path if old path does not exist', () => {
      const nonExistentPath = 'nonexistent.txt'
      const newPath = 'new/path/test.txt'
      
      fileStateManager.updatePath(nonExistentPath, newPath)
      
      const newState = fileStateManager.getFileState(newPath)
      expect(newState).toBeUndefined()
    })

    it('should not update path if new path already exists', () => {
      const existingPath = 'existing.txt'
      const existingFile: FileInfo = {
        ...mockFileInfo,
        name: existingPath,
        path: existingPath
      }
      
      fileStateManager.registerFile(existingPath, {
        file: existingFile,
        status: 'clean'
      })
      
      fileStateManager.updatePath(mockFileInfo.name, existingPath)
      
      const originalState = fileStateManager.getFileState(mockFileInfo.name)
      expect(originalState).toBeDefined()
    })
  })

  describe('File Registration', () => {
    it('should register new file', () => {
      const newFile: FileInfo = {
        ...mockFileInfo,
        name: 'new.txt',
        path: '/new.txt'
      }
      
      const newState: FileState = {
        file: newFile,
        status: 'clean'
      }
      
      fileStateManager.registerFile(newFile.name, newState)
      
      const state = fileStateManager.getFileState(newFile.name)
      expect(state).toEqual(newState)
    })

    it('should not register file if it already exists', () => {
      const existingState = fileStateManager.getFileState(mockFileInfo.name)
      const newState: FileState = {
        ...existingState!,
        status: 'dirty'
      }
      
      fileStateManager.registerFile(mockFileInfo.name, newState)
      
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state).toEqual(existingState)
    })
  })

  describe('File Clearing', () => {
    it('should clear file from state', () => {
      fileStateManager.clear(mockFileInfo.name)
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state).toBeUndefined()
    })
  })

  describe('Dirty State', () => {
    it('should correctly identify dirty state', () => {
      expect(fileStateManager.isDirty(mockFileInfo.name)).toBe(false)
      
      fileStateManager.markDirty(mockFileInfo.name)
      expect(fileStateManager.isDirty(mockFileInfo.name)).toBe(true)
      
      fileStateManager.markClean(mockFileInfo.name)
      expect(fileStateManager.isDirty(mockFileInfo.name)).toBe(false)
    })
  })

  describe('State Management', () => {
    it('should mark file as dirty', () => {
      fileStateManager.markDirty(mockFileInfo.name)
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state?.status).toBe('dirty')
      expect(state?.dirtyTimestamp).toBeDefined()
    })

    it('should mark file as clean', () => {
      fileStateManager.markDirty(mockFileInfo.name)
      fileStateManager.markClean(mockFileInfo.name)
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state?.status).toBe('clean')
      expect(state?.dirtyTimestamp).toBeUndefined()
    })

    it('should mark file as saving', () => {
      fileStateManager.markSaving(mockFileInfo.name)
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state?.status).toBe('saving')
    })

    it('should mark file as error', () => {
      const error = new Error('Test error')
      fileStateManager.markError(mockFileInfo.name, error)
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state?.status).toBe('error')
      expect(state?.error).toBe(error)
    })
  })
})