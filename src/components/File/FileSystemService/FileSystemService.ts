import { FileInfo } from "electron/main/filesystem/types"

class FileSystemService {
  async readFile(filePath: string): Promise<string> {
    return await window.fileSystem.readFile(filePath, 'utf-8')
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    return await window.fileSystem.writeFile({ filePath, content })
  }

  async renameFile(oldPath: string, newPath: string): Promise<void> {
    return await window.fileSystem.renameFile({ oldFilePath: oldPath, newFilePath: newPath })
  }

  async replaceFile(sourcePath: string, destinationPath: string): Promise<void> {
    return await window.fileSystem.replaceFile({ sourcePath, destinationPath })
  }

  async deleteFile(filePath: string): Promise<void> {
    return await window.fileSystem.deleteFile(filePath)
  }

  async createFile(filePath: string, initialContent = ''): Promise<FileInfo | undefined> {
    return await window.fileSystem.createFile(filePath, initialContent)
  }

  async createDirectory(dirPath: string): Promise<void> {
    return await window.fileSystem.createDirectory(dirPath)
  }

  async checkFileExists(filePath: string): Promise<boolean> {
    return await window.fileSystem.checkFileExists(filePath)
  }
}

export default FileSystemService