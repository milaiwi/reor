import { FileInfo, FileState } from "electron/main/filesystem/types"
import EventEmitter from "@/lib/blocknote/core/shared/EventEmitter"

export type FileStateEventTypes = {
  'fileStateChanged': { path: string, state: FileState }
}


class FileStateManager extends EventEmitter<FileStateEventTypes> {
  private stateMap: Map<string, FileState> = new Map()

  constructor(entries: FileInfo[]) {
    super() 
    console.log(`Initiating FileStateManager with: `, entries)
    this.stateMap = new Map(
      entries.map((e) => [
        e.path, // path to the file 
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
   * 
   * @param path of the file
   * @returns the FileState corresponding to the filePath
   */
  getFileState(path: string) {
    console.log(`Getting at path: ${path}`)
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
  registerFile(path: string, file: FileInfo) {
    console.log(`StateMap:`, this.stateMap)
    if (!this.stateMap.get(path)) {
      const fileStateObject = {       
        file: file,
        status: 'clean',
        error: undefined,
        dirtyTimestamp: undefined
      } as FileState
      console.log(`Updating path: ${path}`)
      this.stateMap.set(path, fileStateObject)
    }
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
      this.emit('fileStateChanged', { path, state: fileObject })
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
      this.emit('fileStateChanged', { path, state: fileObject })
    }
  }

  markSaving(path: string) {
    const fileObject = this.stateMap.get(path)
    if (fileObject) {
      fileObject.status = 'saving'
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
      this.emit('fileStateChanged', { path, state: fileObject })
    }
  }
}


export default FileStateManager