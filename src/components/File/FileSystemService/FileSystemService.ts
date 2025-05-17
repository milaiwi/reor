class FileSystemService {
  private writeQueue: Map<string, Promise<void>> = new Map()
  private readQueue: Map<string, Promise<string>> = new Map()

  async read_queue(file_path: string) {
    if (this.readQueue.has(file_path)) {
      return this.readQueue.get(file_path)
    }

    const readPromise = window.fileSystem.readFile(file_path, 'utf-8')
    .finally(() => {
      this.readQueue.delete(file_path)
    })

    this.readQueue.set(file_path, readPromise)
    return readPromise
  }

  async write_queue(file_path: string, content: string) {
    const prevWrite = this.writeQueue.get(file_path)
    if (prevWrite)
      await prevWrite

    const writePromise = window.fileSystem.writeFile({ filePath: file_path, content})
    .finally(() => {
      // Check if the write that completes is also in our queue, if so, remove
      if (this.writeQueue.get(file_path) === writePromise)
        this.writeQueue.delete(file_path)
    })

    this.writeQueue.set(file_path, writePromise)
    return writePromise
  }
}

export default FileSystemService