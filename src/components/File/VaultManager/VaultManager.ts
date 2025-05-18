import FileOperationsManager from '../FileOperationsManager/FileOperationsManager'
import { FileInfo, FileInfoTree, FileState } from "electron/main/filesystem/types";
import { flattenFileInfoTree } from "../../../lib/file";
import EventEmitter from '../../../lib/blocknote/core/shared/EventEmitter'

import path from 'path'

export type VaultEventTypes = {
  // File operations
  'fileOperationStarted': { type: string, path: string }
  'fileOperationCompleted': { type: string, path: string, error?: Error }
  'fileSaved': string
  'fileCreated': FileInfo
  'fileDeleted': { path: string, error?: Error }
  'fileRenamed': { oldPath: string, newPath: string, fileName: string, error?: Error }
  'fileContentLoaded': { path: string, content?: string, error?: Error }

  // File state events
  'fileStateChanged': { path: string, state: FileState }
  'fileBecameDirty': string
  'fileBecameClean': string

  // Structure changes
  'directoryToggled': { path: string, isExpanded: boolean }
  'treeUpdated': FileInfo[][]
  'directoryCreated': FileInfo

  // Selection events
  'fileSelected': string
  'directorySelected': string
}

class VaultManager extends EventEmitter<VaultEventTypes> {
  // @ts-expect-error ts(2564)
  private fileOperationsManager: FileOperationsManager
  private expandedDirectories: Map<string, boolean> = new Map()
  public selectedFilePath: string | null = null
  public selectedDirectoryPath: string | null = null
  
  /**
   * Defines if the VaultManager is ready to be used (initialized) or not.
   * Is only ready when initialize is called
   */
  public ready: boolean = false

  async initialize(): Promise<void> {
    const files: FileInfoTree = await window.fileSystem.getFilesTreeForWindow()
    const flat: FileInfo[] = flattenFileInfoTree(files).map((f: FileInfo) => ({
      ...f,
    }))

    this.fileOperationsManager = new FileOperationsManager(flat)
    this.setupEventRelays()
    this.ready = true

    // Emit tree is ready
    this.emit('treeUpdated', flat)
  }

  /**
   * Set up event relays from FileOperationManager to VaultManager
   */
  private setupEventRelays() {
    // File read events
    this.fileOperationsManager.on('fileReadStarted', (path: string) => {
      this.emit('fileOperationStarted', { type: 'read', path })
    })

    this.fileOperationsManager.on('fileReadCompleted', ({ path, content, error }) => {
      this.emit('fileOperationCompleted', { type: 'read', path, error: error })
      this.emit('fileContentLoaded', { path, content: content, error: error })
    })

    // File write events
    this.fileOperationsManager.on('fileWriteStarted', (path) => {
      this.emit('fileOperationStarted', { type: 'write', path })
    })

    this.fileOperationsManager.on('fileWriteCompleted', ({ path, error}) => {
      this.emit('fileOperationCompleted', { type: 'write', path, error: error })
      this.emit('fileSaved', path)
      this.emit('fileBecameClean', path)
    })

    // File rename events
    this.fileOperationsManager.on('fileRenameCompleted', ({ oldPath, newPath, error }) => {
      this.emit('fileRenamed', {
        oldPath,
        newPath,
        fileName: path.basename(newPath),
        error: error,
      })
    })

    // File delete events
    this.fileOperationsManager.on('fileDeleteCompleted', ({ path, error }) => {
      this.emit('fileDeleted', { path, error })
    })
    
    this.on('fileStateChanged', ({ path, state }) => {
      this.emit('fileStateChanged', { path, state })
    })
  }
 
  /**
   * Toggle directory expansion state
   * @param path the path of the file
   */
  toggleDirectory(path: string): void {
    const isCurrentlyExpanded = this.expandedDirectories.get(path) || false
    this.expandedDirectories.set(path, !isCurrentlyExpanded)

    this.emit('directoryToggled', {
      path,
      isExpanded: !isCurrentlyExpanded
    })
  }

  /**
   * Returns all the expanded directoriesw
   */
  getExpandedDirectories(): Map<string, boolean> {
    return this.expandedDirectories
  }

  selectFile(path: string): void {
    this.selectedFilePath = path
    this.emit('fileSelected', path)
  }

  selectDirectory(path: string): void {
    this.selectedDirectoryPath = path
    this.emit('directorySelected', path)
  }

  // File operations
  async readFile(path: string): Promise<string> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    return this.fileOperationsManager.readFile(path)
  }

  async writeFile(path: string, content: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    this.fileOperationsManager.writeFile(path, content)
  }

  async saveFile(path: string, content: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    return this.fileOperationsManager.saveFile(path, content)
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    return this.fileOperationsManager.renameFile(oldPath, newPath)
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    return this.fileOperationsManager.deleteFile(path)
  }

  async createFile(path: string, initialContent: string = ''): Promise<void> {
    if (!this.ready)
      throw new Error('Vault Manager is not ready yet')
    return this.fileOperationsManager.createFile(path, initialContent)
  }

  async autoSave(path: string, content: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    return this.fileOperationsManager.autoSave(path, content)
  }

  getFileAtPath(path: string): FileState | undefined {
    if (!this.ready)
      throw new Error('Vault manager is not ready yet')
    return this.fileOperationsManager.getFileAtPath(path)
  }
}

export default VaultManager