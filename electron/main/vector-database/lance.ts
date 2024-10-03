import * as lancedb from "@lancedb/lancedb";

import { EnhancedEmbeddingFunction } from './embeddings'
import CreateDatabaseSchema, { isStringifiedSchemaEqual } from './schema'

export const generateTableName = (embeddingFuncName: string, userDirectory: string): string => {
  const sanitizeForFileSystem = (str: string) => str.replace(/[<>:"/\\|?*]/g, '_')

  const directoryPathAlias = sanitizeForFileSystem(userDirectory)
  const sanitizedEmbeddingFuncName = sanitizeForFileSystem(embeddingFuncName)

  return `ragnote_table_${sanitizedEmbeddingFuncName}_${directoryPathAlias}`
}

const GetOrCreateLanceTable = async (
  db: lancedb.Connection,
  embedFunc: EnhancedEmbeddingFunction<string>,
  userDirectory: string,
): Promise<lancedb.Table<string>> => {
  const allTableNames = await db.tableNames()
  const intendedSchema = CreateDatabaseSchema(embedFunc.contextLength)
  const tableName = generateTableName(embedFunc.name, userDirectory)

  if (allTableNames.includes(tableName)) {
    const table = await db.openTable(tableName, embedFunc)
    const schema = await table.schema
    if (!isStringifiedSchemaEqual(schema, intendedSchema)) {
      await db.dropTable(tableName)

      const recreatedTable = await db.createTable({
        name: tableName,
        schema: intendedSchema,
        embeddingFunction: embedFunc,
      })
      return recreatedTable
    }

    return table
  }

  const newTable = await db.createTable({
    name: tableName,
    schema: intendedSchema,
    embeddingFunction: embedFunc,
  })
  return newTable
}

export default GetOrCreateLanceTable
