import FileOperationsManager from '../FileOperationsManager/FileOperationsManager'
import { FileInfo, FileInfoTree, FileState } from "electron/main/filesystem/types";
import { flattenFileInfoTree, getInvalidCharacterInFilePath } from "../../../lib/file";
import EventEmitter from '../../../lib/blocknote/core/shared/EventEmitter'
import { addExtensionIfNoExtensionPresent, extractFileNameFromFilePath, getDirname, isPathAbsolute, joinPaths } from '@/lib/utils/file-util/file-utils';


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
  'directoryCreated': FileInfo
  'treeUpdated': { tree: FileInfoTree, flattenedFiles: FileInfo[] }

  // Selection events
  'fileSelected': string
  'directorySelected': string | null
}

class VaultManager extends EventEmitter<VaultEventTypes> {
  // @ts-expect-error ts(2564)
  private fileOperationsManager: FileOperationsManager
  private expandedDirectories: Map<string, boolean> = new Map()

  public selectedFilePath: string | null = null
  public selectedDirectoryPath: string | null = null
  public fileTreeData: FileInfoTree = []
  public flattenedFiles: FileInfo[] = []
  public vaultDirectory: string = ""
  
  /**
   * Defines if the VaultManager is ready to be used (initialized) or not.
   * Is only ready when initialize is called
   */
  public ready: boolean = false

  async initialize(): Promise<void> {
    await this.updateFileTree()
    this.fileOperationsManager = new FileOperationsManager(this.flattenedFiles)
    this.setupEventRelays()
    this.ready = true

    this.vaultDirectory = await window.electronStore.getVaultDirectoryForWindow()
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
        fileName: extractFileNameFromFilePath(newPath),
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

  async updateFileTree(): Promise<void> {
    const files: FileInfoTree = await window.fileSystem.getFilesTreeForWindow()
    const flat: FileInfo[] = flattenFileInfoTree(files).map((f: FileInfo) => ({
      ...f,
    }))

    this.fileTreeData = files
    this.flattenedFiles = flat

    // Emit event to notify the tree has been updated
    this.emit('treeUpdated', {
      tree: this.fileTreeData,
      flattenedFiles: this.flattenedFiles
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

  selectDirectory(path: string | null): void {
    this.selectedDirectoryPath = path
    this.emit('directorySelected', path)
  }

  getFilesInDirectory(directoryPath: string): FileInfo[] {
    if (!this.ready) throw new Error('VaultManager is not ready yet')
    
      return this.flattenedFiles.filter(file => {
        const fileDir = getDirname(file.path)
        return fileDir === directoryPath
      })
  }

  fileExists(path: string): boolean {
    return this.getFileAtPath(path) !== undefined
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
    console.log(`Inside vault savefile!`)
    return this.fileOperationsManager.saveFile(path, content)
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    const fileObject = this.fileOperationsManager.renameFile(oldPath, newPath)
    this.updateFileTree()
    return fileObject
  }

  async deleteFile(path: string): Promise<void> {
    if (!this.ready)
      throw new Error('VaultManager is not ready yet')
    const fileObject = await this.fileOperationsManager.deleteFile(path)
    this.updateFileTree()
    return fileObject
  }

  async createFile(path: string, initialContent: string = ''): Promise<FileInfo> {
    if (!this.ready)
      throw new Error('Vault Manager is not ready yet')
    const invalidCharacters = getInvalidCharacterInFilePath(path)
    if (invalidCharacters)
      throw new Error(`File path contains invalid characters: ${invalidCharacters}`)

    const filePathWithExtension = addExtensionIfNoExtensionPresent(path)
    const isAbsolutePath = isPathAbsolute(filePathWithExtension)
    const absolutePath = isAbsolutePath
      ? filePathWithExtension
      : joinPaths(this.vaultDirectory, filePathWithExtension)
    
    const fileState = this.getFileAtPath(absolutePath)
    if (!fileState) {
      const newFile = await this.fileOperationsManager.createFile(absolutePath, initialContent)
      if (!newFile) throw new Error(`Could not create file ${filePathWithExtension}`)
      await this.updateFileTree()
      return newFile
    }
    return fileState.file
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

  markDirty(path: string) {
    if (!this.ready)
      throw new Error('Vault manager is not ready yet')
    return this.fileOperationsManager.markDirty(path)
  }
}

export default VaultManager