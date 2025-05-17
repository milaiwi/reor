import { jest } from '@jest/globals'
import FileSystemService from './FileSystemService'

// Mock file operations before any tests run
const mockFileSystem = {
  readFile: jest.fn<(filePath: string, encoding: string) => Promise<string>>(),
  writeFile: jest.fn<(props: { filePath: string; content: string }) => Promise<void>>(),
}

global.window = {
  // @ts-ignore - Mocking window for tests
  fileSystem: mockFileSystem
}

describe('FileSystemService', () => {
  let fileSystemService: FileSystemService

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks()
    
    // Reset the mock implementation
    mockFileSystem.readFile.mockReset()
    mockFileSystem.writeFile.mockReset()
    
    fileSystemService = new FileSystemService()
  })

  describe('read_queue', () => {
    it('should read file content successfully', async () => {
      const filePath = 'test.txt'
      const expectedContent = 'test content'
      
      mockFileSystem.readFile.mockResolvedValueOnce(expectedContent)
      
      const result = await fileSystemService.read_queue(filePath)
      
      expect(result).toBe(expectedContent)
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(filePath, 'utf-8')
    })

    it('should handle nested file paths', async () => {
      const filePath = 'nested/folder/test.txt'
      const expectedContent = 'nested content'
      
      mockFileSystem.readFile.mockResolvedValueOnce(expectedContent)
      
      const result = await fileSystemService.read_queue(filePath)
      
      expect(result).toBe(expectedContent)
      expect(mockFileSystem.readFile).toHaveBeenCalledWith(filePath, 'utf-8')
    })

    it('should handle non-existent files', async () => {
      const filePath = 'nonexistent.txt'
      const error = new Error('File not found')
      
      mockFileSystem.readFile.mockRejectedValueOnce(error)
      
      await expect(fileSystemService.read_queue(filePath)).rejects.toThrow('File not found')
    })

    it('should queue multiple read requests for the same file', async () => {
      const filePath = 'test.txt'
      const expectedContent = 'test content'
      
      mockFileSystem.readFile.mockResolvedValueOnce(expectedContent)
      
      const read1 = fileSystemService.read_queue(filePath)
      const read2 = fileSystemService.read_queue(filePath)
      
      const [result1, result2] = await Promise.all([read1, read2])
      
      expect(result1).toBe(expectedContent)
      expect(result2).toBe(expectedContent)
      expect(mockFileSystem.readFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('write_queue', () => {
    it('should write file content successfully', async () => {
      const filePath = 'test.txt'
      const content = 'test content'
      
      mockFileSystem.writeFile.mockResolvedValueOnce(undefined)
      
      await fileSystemService.write_queue(filePath, content)
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledWith({
        filePath,
        content
      })
    })

    it('should handle nested file paths', async () => {
      const filePath = 'nested/folder/test.txt'
      const content = 'nested content'
      
      mockFileSystem.writeFile.mockResolvedValueOnce(undefined)
      
      await fileSystemService.write_queue(filePath, content)
      
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
      
      await expect(fileSystemService.write_queue(filePath, content)).rejects.toThrow('Write failed')
    })

    it('should queue multiple write requests for the same file', async () => {
      const filePath = 'test.txt'
      const content1 = 'content 1'
      const content2 = 'content 2'
      
      mockFileSystem.writeFile
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
      
      const write1 = fileSystemService.write_queue(filePath, content1)
      const write2 = fileSystemService.write_queue(filePath, content2)
      
      await Promise.all([write1, write2])
      
      expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(2)
      expect(mockFileSystem.writeFile).toHaveBeenNthCalledWith(1, {
        filePath,
        content: content1
      })
      expect(mockFileSystem.writeFile).toHaveBeenNthCalledWith(2, {
        filePath,
        content: content2
      })
    })

    it('should wait for previous write to complete before starting new write', async () => {
      const filePath = 'test.txt'
      const content1 = 'content 1'
      const content2 = 'content 2'
      
      let firstWriteResolve: () => void
      const firstWritePromise = new Promise<void>(resolve => {
        firstWriteResolve = resolve
      })
      
      mockFileSystem.writeFile
        .mockImplementationOnce(() => firstWritePromise)
        .mockResolvedValueOnce(undefined)
      
      const write1 = fileSystemService.write_queue(filePath, content1)
      const write2 = fileSystemService.write_queue(filePath, content2)
      
      // First write should be called immediately
      expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(1)
      
      // Resolve first write
      firstWriteResolve!()
      
      // Wait for both writes to complete
      await Promise.all([write1, write2])
      
      // Second write should be called after first write completes
      expect(mockFileSystem.writeFile).toHaveBeenCalledTimes(2)
    })
  })
})