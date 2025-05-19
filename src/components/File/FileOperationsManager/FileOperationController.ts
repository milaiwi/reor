class FileOperationsQueue {
  private queue: Map<string, Promise<unknown>> = new Map()

  /**
   * Enqueues a file operation to run after all previous operations
   * on the same path have completed. Returns the result of the operation.
   */
  enqueue<T>(path: string, op: () => Promise<T>): Promise<T> {
    const previous = this.queue.get(path) ?? Promise.resolve()

    let resolveNext: () => void
    const next = new Promise<void>((resolve) => {
      resolveNext = resolve
    })

    const operation = previous.then(() => op())
      .finally(() => {
        resolveNext()
        if (this.queue.get(path) === next) {
          this.queue.delete(path)
        }
      })

    this.queue.set(path, next)
    return operation
  }

  /**
   * Waits until all currently queued operations for the given path finish.
   * Does not enqueue anything.
   */
  waitFor(path: string): Promise<void> {
    return this.queue.get(path) as Promise<void> ?? Promise.resolve()
  }
}

export default FileOperationsQueue
