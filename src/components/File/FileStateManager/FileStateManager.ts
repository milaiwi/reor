import { FileInfo, FileState } from "electron/main/filesystem/types"
import FileSystemService from "../FileSystemService/FileSystemService"

class FileStateManager {
  private stateMap: Map<string, FileState> = new Map()
  private subscribers: Set<(path: string, state: FileState) => void> = new Set()

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
   * Updates oldPath to newPath (if exists)
   * 
   * @param oldPath old path to file
   * @param newPath new path to file to update old path with
   */
  updatePath(oldPath: string, newPath: string) {
    const oldFileObject = this.stateMap.get(oldPath)
    const newFileObject = this.stateMap.get(newPath)
    // For this to work, a file at oldPath must exist and a file at newFile cannot exist.
    if (!oldFileObject || newFileObject)
      return 
    
    oldFileObject.file.path = newPath
    this.stateMap.set(newPath, oldFileObject)
    this.stateMap.delete(oldPath)
  }

  /**
   * Deletes the path from existing in the state manager.
   * 
   * @param path path to delete from stateMap
   */
  clear(path: string) {
    this.stateMap.delete(path)
  }

  /**
   * Registers a new file with the FileStateManager. If file already exits, does nothing.
   * 
   * @param path the path to the file
   * @param state the new state to register
   */
  registerFile(path: string, state: FileState) {
    if (!this.stateMap.get(path))
      this.stateMap.set(path, state)
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
   * Returns true if the file is dirty
   */
  isDirty(path: string) {
    const fileObject = this.stateMap.get(path)
    return fileObject && fileObject.status === 'dirty'
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
  emit(path: string, state: FileState) {
    this.subscribers.forEach(cb => cb(path, state))
  }
}


export default FileStateManager