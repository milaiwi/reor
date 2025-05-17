import { jest } from '@jest/globals'
import FileStateManager from './FileStateManager'
import FileSystemService from '../FileSystemService/FileSystemService'
import { FileInfo } from 'electron/main/filesystem/types'

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
    // Reset mocks before each test
    jest.resetAllMocks()
    
    // Create mock for window.fileSystem
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

  describe('Subscription', () => {
    it('should notify subscribers of state changes', () => {
      const mockCallback = jest.fn()
      const unsubscribe = fileStateManager.subscribe(mockCallback)
      
      fileStateManager.markDirty(mockFileInfo.name)
      
      expect(mockCallback).toHaveBeenCalledWith(
        mockFileInfo.name,
        expect.objectContaining({
          status: 'dirty',
          file: mockFileInfo
        })
      )
      
      unsubscribe()
    })

    it('should allow unsubscribing', () => {
      const mockCallback = jest.fn()
      const unsubscribe = fileStateManager.subscribe(mockCallback)
      
      unsubscribe()
      fileStateManager.markDirty(mockFileInfo.name)
      
      expect(mockCallback).not.toHaveBeenCalled()
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

  describe('AutoSave', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should not auto-save if file is not dirty', async () => {
      await fileStateManager.autoSave(mockFileInfo.name, 'content', fsService)
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled()
    })

    it('should not auto-save if time elapsed is less than threshold', async () => {
      fileStateManager.markDirty(mockFileInfo.name)
      await fileStateManager.autoSave(mockFileInfo.name, 'content', fsService)
      expect(mockFileSystem.writeFile).not.toHaveBeenCalled()
    })

    it('should auto-save if time elapsed is greater than threshold', async () => {
      fileStateManager.markDirty(mockFileInfo.name)
      jest.advanceTimersByTime(6000) // Advance 6 seconds
      
      mockFileSystem.writeFile.mockResolvedValueOnce(undefined)
      await fileStateManager.autoSave(mockFileInfo.name, 'content', fsService)
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith({
        filePath: mockFileInfo.name,
        content: 'content'
      })
      
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state?.status).toBe('clean')
    })

    it('should handle auto-save errors', async () => {
      fileStateManager.markDirty(mockFileInfo.name)
      jest.advanceTimersByTime(6000)
      
      const error = new Error('Write failed')
      mockFileSystem.writeFile.mockRejectedValueOnce(error)
      
      await fileStateManager.autoSave(mockFileInfo.name, 'content', fsService)
      
      const state = fileStateManager.getFileState(mockFileInfo.name)
      expect(state?.status).toBe('error')
      expect(state?.error).toBe(error)
    })
  })
})