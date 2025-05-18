import FileSystemService from "../FileSystemService/FileSystemService"
import FileStateManager from "../FileStateManager/FileStateManager"
import FileOperationsQueue from "./FileOperationController"
import { FileInfo, FileState } from "electron/main/filesystem/types"
import EventEmitter from '../../../lib/blocknote/core/shared/EventEmitter'
import path from 'path'

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
    this.emit('fileReadStarted', path)

    try{
      await this.queue.waitFor(path)
      const content = await this.service.readFile(path)
      this.emit('fileReadCompleted', { path, content: content })
      return content
    } catch (err: any) {
      this.emit('fileReadCompleted', { path, error: err as Error })
      throw err
    }
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.state.isDirty(path)) // Matches with disk file, no need to write!
      return

    this.emit('fileWriteStarted', path)

    try {
      await this.queue.enqueue(path, async () => {
        this.state.markSaving(path)
        try {
          await this.service.writeFile(path, content)
          this.emit('fileWriteCompleted', { path })
        } finally {
          this.state.markClean(path)
        }
      })
    } catch (err: any) {
      this.emit('fileWriteCompleted', { path, error: err as Error})
      throw err
    }
  }

  /**
   * Exact functionality as writeFile but better name convention for certain scenarioes
   * 
   * @param path the path of the file
   * @param content the content of the file to save
   */
  async saveFile(path: string, content: string): Promise<void> {
    this.writeFile(path, content)
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.state.getFileState(oldPath) || this.state.getFileState(newPath))
      return

    this.emit('fileRenameStarted', { oldPath, newPath })
    const fileName = path.basename(newPath)
    try {
      await Promise.all([
        this.queue.waitFor(oldPath),
        this.queue.waitFor(newPath),
      ])
  
      await this.queue.enqueue(oldPath, async () => {
        await this.service.renameFile(oldPath, newPath)
        this.state.updatePath(oldPath, newPath)
        this.emit('fileRenameCompleted', { oldPath, newPath, fileName })
      })
    } catch (err: any) {
      const fileName = path.basename(newPath)
      this.emit('fileRenameCompleted', { oldPath, newPath, fileName, error: err as Error})
      throw err
    }
  }

  async deleteFile(path: string): Promise<void> {
    this.emit('fileDeleteStarted', path)

    try {
      await this.queue.enqueue(path, async () => {
        await this.service.deleteFile(path)
        this.state.clear(path)
      })

      this.emit('fileDeleteCompleted', { path })
    } catch (err) {
      this.emit('fileDeleteCompleted', { path, error: err as Error })
      throw err
    }
  }

  async createFile(path: string, content: string = ''): Promise<void> {
    this.emit('fileCreateStarted', path)

    try {
      await this.queue.enqueue(path, async () => {
        await this.service.createFile(path, content)
      })

      this.emit('fileCreateCompleted', { path })
    } catch (err) {
      this.emit('fileCreateCompleted', { path, error: err as Error})
    }
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
}

export default FileOperationsManager