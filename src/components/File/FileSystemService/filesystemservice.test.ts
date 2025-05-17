import { jest } from '@jest/globals'
import FileSystemService from './FileSystemService'
import { FileInfo } from 'electron/main/filesystem/types'

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService
  let mockFileSystem: any

  beforeEach(() => {
    jest.resetAllMocks()
    
    mockFileSystem = {
      readFile: jest.fn<(filePath: string, encoding: string) => Promise<string>>(),
      writeFile: jest.fn<(props: { filePath: string; content: string }) => Promise<void>>(),
      renameFile: jest.fn<(props: { oldFilePath: string; newFilePath: string }) => Promise<void>>(),
      deleteFile: jest.fn<(filePath: string) => Promise<void>>(),
      createFile: jest.fn<(filePath: string, content: string) => Promise<FileInfo | undefined>>(),
      checkFileExists: jest.fn<(filePath: string) => Promise<boolean>>()
    }
    
    // @ts-ignore - Mocking window for tests
    global.window = {
      fileSystem: mockFileSystem
    }
    
    fileSystemService = new FileSystemService()
  })

  describe('readFile', () => {
    it('should read file content successfully', async () => {
      const filePath = 'test.txt'
      const expectedContent = 'test content'
      
      mockFileSystem.readFile.mockResolvedValueOnce(expectedContent)
      
      const result = await fileSystemService.readFile(filePath)
      
      expect(result).toBe(expectedContent)
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(filePath, 'utf-8')
    })

    it('should handle read errors', async () => {
      const filePath = 'test.txt'
      const error = new Error('Read failed')
      
      mockFileSystem.readFile.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.readFile(filePath)).rejects.toThrow('Read failed')
    })
  })

  describe('writeFile', () => {
    it('should write file content successfully', async () => {
      const filePath = 'test.txt'
      const content = 'test content'
      
      mockFileSystem.writeFile.mockResolvedValueOnce(undefined)
      
      await fileSystemService.writeFile(filePath, content)
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith({
        filePath,
        content
      })
    })

    it('should handle write errors', async () => {
      const filePath = 'test.txt'
      const content = 'test content'
      const error = new Error('Write failed')
      
      mockFileSystem.writeFile.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.writeFile(filePath, content)).rejects.toThrow('Write failed')
    })
  })

  describe('renameFile', () => {
    it('should rename file successfully', async () => {
      const oldPath = 'old.txt'
      const newPath = 'new.txt'
      
      mockFileSystem.renameFile.mockResolvedValueOnce(undefined)
      
      await fileSystemService.renameFile(oldPath, newPath)
      
      expect(mockFileSystem.renameFile).toHaveBeenCalledWith({
        oldFilePath: oldPath,
        newFilePath: newPath
      })
    })

    it('should handle rename errors', async () => {
      const oldPath = 'old.txt'
      const newPath = 'new.txt'
      const error = new Error('Rename failed')
      
      mockFileSystem.renameFile.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.renameFile(oldPath, newPath)).rejects.toThrow('Rename failed')
    })
  })

  describe('deleteFile', () => {
    it('should delete file successfully', async () => {
      const filePath = 'test.txt'
      
      mockFileSystem.deleteFile.mockResolvedValueOnce(undefined)
      
      await fileSystemService.deleteFile(filePath)
      
      expect(mockFileSystem.deleteFile).toHaveBeenCalledWith(filePath)
    })

    it('should handle delete errors', async () => {
      const filePath = 'test.txt'
      const error = new Error('Delete failed')
      
      mockFileSystem.deleteFile.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.deleteFile(filePath)).rejects.toThrow('Delete failed')
    })
  })

  describe('createFile', () => {
    it('should create file successfully', async () => {
      const filePath = 'test.txt'
      const initialContent = 'initial content'
      const expectedFileInfo: FileInfo = {
        name: 'test.txt',
        path: '/test.txt',
        relativePath: 'test.txt',
        dateModified: new Date(),
        dateCreated: new Date()
      }
      
      mockFileSystem.createFile.mockResolvedValueOnce(expectedFileInfo)
      
      const result = await fileSystemService.createFile(filePath, initialContent)
      
      expect(result).toEqual(expectedFileInfo)
      expect(mockFileSystem.createFile).toHaveBeenCalledWith(filePath, initialContent)
    })

    it('should create file with empty content by default', async () => {
      const filePath = 'test.txt'
      
      await fileSystemService.createFile(filePath)
      
      expect(mockFileSystem.createFile).toHaveBeenCalledWith(filePath, '')
    })

    it('should handle create errors', async () => {
      const filePath = 'test.txt'
      const error = new Error('Create failed')
      
      mockFileSystem.createFile.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.createFile(filePath)).rejects.toThrow('Create failed')
    })
  })

  describe('checkFileExists', () => {
    it('should return true for existing file', async () => {
      const filePath = 'test.txt'
      
      mockFileSystem.checkFileExists.mockResolvedValueOnce(true)
      
      const result = await fileSystemService.checkFileExists(filePath)
      
      expect(result).toBe(true)
      expect(mockFileSystem.checkFileExists).toHaveBeenCalledWith(filePath)
    })

    it('should return false for non-existent file', async () => {
      const filePath = 'nonexistent.txt'
      
      mockFileSystem.checkFileExists.mockResolvedValueOnce(false)
      
      const result = await fileSystemService.checkFileExists(filePath)
      
      expect(result).toBe(false)
      expect(mockFileSystem.checkFileExists).toHaveBeenCalledWith(filePath)
    })

    it('should handle check errors', async () => {
      const filePath = 'test.txt'
      const error = new Error('Check failed')
      
      mockFileSystem.checkFileExists.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.checkFileExists(filePath)).rejects.toThrow('Check failed')
    })
  })
})