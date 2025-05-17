import FileSystemService from "../FileSystemService/FileSystemService"
import FileStateManager from "../FileStateManager/FileStateManager"
import FileOperationsQueue from "./FileOperationController"
import { FileInfo } from "electron/main/filesystem/types"


class FileOperationsManager {
  private service: FileSystemService
  private state: FileStateManager
  private queue: FileOperationsQueue
  private TIME_ELAPSED_SINCE_LAST_WRITE: number = 5

  constructor(entries: FileInfo[]) {
    this.service = new FileSystemService()
    this.state = new FileStateManager(entries)
    this.queue = new FileOperationsQueue()
  }

  async readFile(path: string): Promise<string> {
    await this.queue.waitFor(path)
    return this.service.readFile(path)
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.state.isDirty(path)) // Matches with disk file, no need to write!
      return

    await this.queue.enqueue(path, async () => {
      this.state.markSaving(path)
      try {
        await this.service.writeFile(path, content)
      } finally {
        this.state.markClean(path)
      }
    })
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.state.getFileState(oldPath) || this.state.getFileState(newPath))
      return
    
    await Promise.all([
      this.queue.waitFor(oldPath),
      this.queue.waitFor(newPath),
    ])

    await this.queue.enqueue(oldPath, async () => {
      await this.service.renameFile(oldPath, newPath)
      this.state.updatePath(oldPath, newPath)
    })
  }

  async deleteFile(path: string): Promise<void> {
    await this.queue.enqueue(path, async () => {
      await this.service.deleteFile(path)
      this.state.clear(path)
    })
  }

  async autoSave(path: string, content: string): Promise<void> {
    const fileObject = this.state.getFileState(path)
    if (!fileObject || fileObject.status !== 'dirty' || !fileObject.dirtyTimestamp) return Promise.resolve()

    const timeSinceDirty = Date.now() - fileObject.dirtyTimestamp
    if (timeSinceDirty < this.TIME_ELAPSED_SINCE_LAST_WRITE * 1000) return Promise.resolve()

    fileObject.status = 'saving'
    this.state.emit(path, fileObject)

    return this.queue.enqueue(path, async () => {
      fileObject.status = 'saving'
      this.state.emit(path, fileObject)

      try {
        await this.service.writeFile(path, content)
        this.state.markClean(path)
      } catch (err: any) {
        this.state.markError(path, err)
      }
    })
  }
}