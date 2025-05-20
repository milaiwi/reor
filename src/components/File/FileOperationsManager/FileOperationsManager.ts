import FileSystemService from "../FileSystemService/FileSystemService"
import FileStateManager from "../FileStateManager/FileStateManager"
import FileOperationsQueue from "./FileOperationController"
import { FileInfo, FileState } from "electron/main/filesystem/types"
import EventEmitter from '../../../lib/blocknote/core/shared/EventEmitter'

// Define event types for FileOperationsManager
export type FileOperationsEventTypes = {
  // File operations
  'fileReadStarted': string
  'fileReadCompleted': { path: string, content?: string, error?: Error }
  
  'fileWriteStarted': string
  'fileWriteCompleted': {path: string, error?: Error}
  
  'fileRenameStarted': { oldPath: string, newPath: string }
  'fileRenameCompleted': { oldPath: string, newPath: string, fileName: string, error?: Error }
  
  'fileDeleteStarted': string
  'fileDeleteCompleted': { path: string, error?: Error}
  
  'autoSaveStarted': string
  'autoSaveCompleted': { path: string, error?: Error }

  'fileCreateStarted': string
  'fileCreateCompleted': { path: string, error?: Error }

  // File state
  'fileStateChanged': { path: string, state: FileState }
}

class FileOperationsManager extends EventEmitter<FileOperationsEventTypes> {
  private service: FileSystemService
  private state: FileStateManager
  private queue: FileOperationsQueue
  private TIME_ELAPSED_SINCE_LAST_WRITE: number = 5

  constructor(entries: FileInfo[]) {
    super()
    this.service = new FileSystemService()
    this.state = new FileStateManager(entries)
    this.queue = new FileOperationsQueue()

    this.state.on('fileStateChanged', ({ path, state }) => {
      this.emit('fileStateChanged', { path, state })
    })
  }

  async readFile(path: string): Promise<string> {
    // this.emit('fileReadStarted', path)

    try{
      await this.queue.waitFor(path)
      const content = await this.service.readFile(path)
      // this.emit('fileReadCompleted', { path, content: content })
      return content
    } catch (err: any) {
      // this.emit('fileReadCompleted', { path, error: err as Error })
      throw new Error(err)
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    console.log(`is dirty: ${this.state.isDirty(path)}`)
    if (!this.state.isDirty(path)) // Matches with disk file, no need to write!
      return

    // this.emit('fileWriteStarted', path)

    try {
      await this.queue.enqueue(path, async () => {
        this.state.markSaving(path)
        try {
          await this.service.writeFile(path, content)
          // this.emit('fileWriteCompleted', { path })
        } finally {
          this.state.markClean(path)
        }
      })
    } catch (err: any) {
      // this.emit('fileWriteCompleted', { path, error: err as Error})
      throw new Error(err)
    }
  }

  /**
   * Exact functionality as writeFile but better name convention for certain scenarioes
   * 
   * @param path the path of the file
   * @param content the content of the file to save
   */
  async saveFile(path: string, content: string): Promise<void> {
    console.log(`Writing ${content} to ${path}`)
    this.writeFile(path, content)
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.state.getFileState(oldPath) || this.state.getFileState(newPath))
      return

    this.emit('fileRenameStarted', { oldPath, newPath })
    try {
      await Promise.all([
        this.queue.waitFor(oldPath),
        this.queue.waitFor(newPath),
      ])
  
      await this.queue.enqueue(oldPath, async () => {
        await this.service.renameFile(oldPath, newPath)
        this.state.updatePath(oldPath, newPath)
      })
    } catch (err: any) {
      throw new Error
    }
  }

  async deleteFile(path: string): Promise<void> {
    console.log(`Deleting file at path: ${path}`)
    this.emit('fileDeleteStarted', path)

    try {
      await this.queue.enqueue(path, async () => {
        await this.service.deleteFile(path)
      })
      this.state.clear(path)

      this.emit('fileDeleteCompleted', { path })
    } catch (err) {
      this.emit('fileDeleteCompleted', { path, error: err as Error })
      throw err
    }
  }

  async createFile(path: string, content: string = ''): Promise<FileInfo | undefined> {
    try {
      const fileObject = await this.queue.enqueue(path, async () => {
        const completedObject = await this.service.createFile(path, content)
        if (!completedObject)
          throw new Error("Failed to create new file")
        this.state.registerFile(path, completedObject)
        return completedObject
      })

      return fileObject
    } catch (err) {
      return undefined
    }
  }

  async replaceFile(sourcePath: string, destinationPath: string): Promise<void> {
    await Promise.all([
      this.queue.waitFor(sourcePath),
      this.queue.waitFor(destinationPath),
    ])

    // Single queue operation for atomicity
    return this.queue.enqueue(destinationPath, async () => {
      try {
        // Use the new specialized service method
        await this.service.replaceFile(sourcePath, destinationPath)
        
        // Update the file state
        this.state.clear(destinationPath) // Clear the old destination file state
        this.state.updatePath(sourcePath, destinationPath) // Update the path
        
        console.log(`Successfully replaced ${destinationPath} with ${sourcePath}`)
      } catch (error) {
        console.error(`Error in replaceFile: ${error}`)
        throw error
      }
    })
  }

  async moveDirectory(sourcePath: string, destinationPath: string): Promise<void> {
    await Promise.all([
      this.queue.waitFor(sourcePath),
      this.queue.waitFor(destinationPath),
    ])

    return this.queue.enqueue(destinationPath, async () => {
      try {
        await this.service.moveDirectory(sourcePath, destinationPath)
        this.state.updatePath(sourcePath, destinationPath)
        console.log(`Successfully moved directory from ${sourcePath} to ${destinationPath}`)
      } catch (error) {
        console.error(`Error in moveDirectory: ${error}`)
        throw error
      }
    })
  }

  async createDirectory(dirPath: string): Promise<void> {
    this.queue.enqueue(dirPath, async () => {
      await this.service.createDirectory(dirPath)
    })
  }

  async autoSave(path: string, content: string): Promise<void> {
    const fileObject = this.state.getFileState(path)
    if (!fileObject || fileObject.status !== 'dirty' || !fileObject.dirtyTimestamp) return Promise.resolve()

    const timeSinceDirty = Date.now() - fileObject.dirtyTimestamp
    if (timeSinceDirty < this.TIME_ELAPSED_SINCE_LAST_WRITE * 1000) return Promise.resolve()

    this.emit('autoSaveStarted', path)
    fileObject.status = 'saving'

    try {
      this.queue.enqueue(path, async () => {
        fileObject.status = 'saving'
  
        try {
          await this.service.writeFile(path, content)
          this.state.markClean(path)
          this.emit('autoSaveCompleted', { path })
        } catch (err: any) {
          this.state.markError(path, err)
          this.emit('autoSaveCompleted', { path, error: err as Error})
          throw Error
        }
      })

      return
    } catch (err: any) {
      this.emit('autoSaveCompleted', { path, error: err as Error })
      throw err
    }
  }

  getFileAtPath(path: string): FileState | undefined {
    return this.state.getFileState(path)
  }

  markDirty(path: string): void {
    return this.state.markDirty(path)
  }
}

export default FileOperationsManager