import { FileInfo, FileState } from "electron/main/filesystem/types"
import FileSystemService from "../FileSystemService/FileSystemService"

class FileStateManager {
  private stateMap: Map<string, FileState> = new Map()
  private subscribers: Set<(path: string, state: FileState) => void> = new Set()
  private TIME_ELAPSED_SINCE_LAST_WRITE: number = 5

  constructor(entries: FileInfo[]) {
    this.stateMap = new Map(
      entries.map((e) => [
        e.name, // path to the file 
        {       // the FileState object
          file: e,
          status: 'clean',
          error: undefined,
          dirtyTimestamp: undefined
        } satisfies FileState,
      ])
    )
  }

  /**
   * Allows for different components to subscribe to our FileStateManager. Good for notifying any UI changes.
   * 
   * @param callback content to pass back to a subscribed event
   * @returns returns the callback to unsubscribe
   */
  subscribe(callback: (path: string, state: FileState) => void): () => void {
    this.subscribers.add(callback)
    return () => this.subscribers.delete(callback)
  }

  /**
   * 
   * @param path of the file
   * @returns the FileState corresponding to the filePath
   */
  getFileState(path: string) {
    return this.stateMap.get(path)
  }

  /**
   * Checks if we should write the content of a file if the last change to editor was > TIME_ELAPSED_SINCE_LAST_WRITE.
   * 
   * @param path of the file
   */
  async autoSave(path: string, content: string, fsService: FileSystemService): Promise<void> {
    const fileObject = this.stateMap.get(path)
    if (!fileObject || fileObject.status !== 'dirty' || !fileObject.dirtyTimestamp) return Promise.resolve()

    const timeSinceDirty = Date.now() - fileObject.dirtyTimestamp
    if (timeSinceDirty < this.TIME_ELAPSED_SINCE_LAST_WRITE * 1000) return Promise.resolve()

    fileObject.status = 'saving'
    this.emit(path, fileObject)

    return fsService.write_queue(path, content)
      .then(() => {
        this.markClean(path)
      })
      .catch((err) => {
        this.markError(path, err)
      })
  }

  /**
   * marks the File at path dirty
   * @param path of the file
   */
  markDirty(path: string) {
    const fileObject = this.stateMap.get(path)
    if (fileObject) {
      fileObject.status = 'dirty'
      fileObject.dirtyTimestamp = Date.now()
      this.emit(path, fileObject)
    }
  }

  /**
   * Marks the file as clean (content of file matches file at disk)
   * 
   * @param path of the file
   */
  markClean(path: string) {
    const fileObject = this.stateMap.get(path)
    if (fileObject) {
      fileObject.status = 'clean'
      fileObject.dirtyTimestamp = undefined
      this.emit(path, fileObject)
    }
  }

  markSaving(path: string) {
    const fileObject = this.stateMap.get(path)
    if (fileObject) {
      fileObject.status = 'saving'
      this.emit(path, fileObject)
    }
  }

  /**
   * Marks the status of the file as 'error'
   * 
   * @param path of the file
   * @param err The error received when interacting with the file (saving/loading)
   */
  markError(path: string, err: Error) {
    const fileObject = this.stateMap.get(path)
    if (fileObject) {
      fileObject.status = 'error'
      fileObject.error = err
      this.emit(path, fileObject)
    }
  }

  /**
   * Passes in the path and state for each subscribed event. Notifies each subscribed that 
   *  the file at path has changed.
   * 
   * @param path the path of the file
   * @param state the current state of the file 
   */
  private emit(path: string, state: FileState) {
    this.subscribers.forEach(cb => cb(path, state))
  }
}

export default FileStateManager