import { Connection, Table as LanceDBTable, makeArrowTable } from '@lancedb/lancedb'

import { EmbeddingModelConfig } from '../electron-store/storeConfig'

import { EnhancedEmbeddingFunction, createEmbeddingFunction } from './embeddings'
import GetOrCreateLanceTable from './lance'
import { DBEntry, DBQueryResult, DatabaseFields } from './schema'

export function unsanitizePathForFileSystem(dbPath: string): string {
  return dbPath.replace(/''/g, "'")
}

export function convertRecordToDBType<T extends DBEntry | DBQueryResult>(record: Record<string, unknown>): T | null {
  const { vector, ...recordWithoutVector } = record
  const recordWithType = recordWithoutVector as unknown as T
  recordWithType.notepath = unsanitizePathForFileSystem(recordWithType.notepath)
  return recordWithType
}

export function sanitizePathForDatabase(filePath: string): string {
  return filePath.replace(/'/g, "''")
}

class LanceDBTableWrapper {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public lanceTable!: LanceDBTable

  private embedFun!: EnhancedEmbeddingFunction<string>

  async initialize(dbConnection: Connection, userDirectory: string, embeddingModelConfig: EmbeddingModelConfig) {
    console.log('Initialized the embedding function')
    this.embedFun = await createEmbeddingFunction(embeddingModelConfig, 'content')
    console.log(`embedFun has embed with:`, this.embedFun.embed)
    this.lanceTable = await GetOrCreateLanceTable(dbConnection, this.embedFun, userDirectory)
  }

  async add(_data: DBEntry[], onProgress?: (progress: number) => void): Promise<void> {
    const data = _data
      .filter((x) => x.content !== '')
      .map((_x) => {
        const x = _x
        x.notepath = sanitizePathForDatabase(x.notepath)
        return x
      })

    // clean up previously indexed entries and reindex the whole file
    await this.deleteDBItemsByFilePaths(data.map((x) => x.notepath))

    const recordEntry: Record<string, unknown>[] = data as unknown as Record<string, unknown>[]
    const numberOfChunksToIndexAtOnce = process.platform === 'darwin' ? 50 : 40
    const chunks = []
    for (let i = 0; i < recordEntry.length; i += numberOfChunksToIndexAtOnce) {
      chunks.push(recordEntry.slice(i, i + numberOfChunksToIndexAtOnce))
    }

    if (chunks.length === 0) return

    const totalChunks = chunks.length

    console.log('Started reducing chunks')
    console.log('Total chunks:', totalChunks)
    console.log(`Chunks: ${JSON.stringify(chunks)}`)
    await chunks.reduce(async (previousPromise, chunk, index) => {
      await previousPromise
      const arrowTableOfChunk = makeArrowTable(chunk)
      console.log('Started adding arrowTableOfChunk to lanceTable ')
      console.log(`ArrowTableChunk: ${arrowTableOfChunk}`)

      const arrowSchema = arrowTableOfChunk.schema
      const tableSchema = await this.lanceTable.schema()
      console.log(`Have schemal: ${arrowSchema}`)
      console.log(`Missing schema: ${tableSchema}`)
      await this.lanceTable.add(arrowTableOfChunk)
      console.log('Finished adding arrowTableOfChunk to lanceTable ')
      const progress = (index + 1) / totalChunks
      if (onProgress) {
        onProgress(progress)
      }
    }, Promise.resolve())
    console.log('Finished reducing chunks')
  }

  async deleteDBItemsByFilePaths(filePaths: string[]): Promise<void> {
    const quotedFilePaths = filePaths
      .map((filePath) => sanitizePathForDatabase(filePath))
      .map((filePath) => `'${filePath}'`)
      .join(', ')
    if (quotedFilePaths === '') {
      return
    }
    const filterString = `${DatabaseFields.NOTE_PATH} IN (${quotedFilePaths})`
    try {
      await this.lanceTable.delete(filterString)
    } catch (error) {
      //  no need to throw error
    }
  }

  async updateDBItemsWithNewFilePath(oldFilePath: string, newFilePath: string): Promise<void> {
    const sanitizedFilePath = sanitizePathForDatabase(oldFilePath)
    if (sanitizedFilePath === '') {
      return
    }
    const filterString = `${DatabaseFields.NOTE_PATH} = '${sanitizedFilePath}'`
    try {
      await this.lanceTable.update({
        where: filterString,
        values: {
          [DatabaseFields.NOTE_PATH]: sanitizePathForDatabase(newFilePath),
        },
      })
    } catch (error) {
      // no need to throw error
    }
  }

  /**
   * Returns a list of DB records after making a query search. Defaults to vector search
   *
   * @param query: the query
   * @param limit:  the amount of elements to return after searching
   * @param filter: condition to filter columns by (ex: id != 4)
   * @param query_type: the type of query, "vector", "fts", or "hybrid"
   * @returns a list of DB records
   */
  async search(query: string, limit: number, filter?: string, query_type?: string): Promise<DBQueryResult[]> {
    const queryVector = await this.embedFun.computeSourceEmbeddings([query])
    const searchResults = this.lanceTable.search(queryVector[0], query_type || 'vector').limit(limit)
    if (filter) searchResults.where(filter)

    const rawResults = await searchResults.toArray()
    const mapped = rawResults.map(convertRecordToDBType<DBQueryResult>)
    return mapped as DBQueryResult[]
  }

  /**
   *
   * @param filterString: condition to filter columns by (ex: id != 4)
   * @param limit: the amount of elements to return after searching
   */
  async filter(filterString: string, limit: number = 10): Promise<DBEntry[]> {
    const rawResults = await this.lanceTable.query().where(filterString).limit(limit).toArray()

    const mapped = rawResults.map(convertRecordToDBType<DBEntry>)
    return mapped as DBEntry[]
  }

  async getVectorForContent(content: string, fileName?: string) {
    const embeddings = await this.embedFun.computeSourceEmbeddings([content])
    return embeddings[0]
  }
}

export default LanceDBTableWrapper
