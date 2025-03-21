import * as fs from 'fs'

import { chunkMarkdownByHeadingsAndByCharsIfBig } from '../common/chunking'
import {
  GetFilesInfoList,
  GetFilesInfoTree,
  flattenFileInfoTree,
  moveFileOrDirectoryInFileSystem,
  readFile,
} from '../filesystem/filesystem'
import { FileInfo, FileInfoTree } from '../filesystem/types'

import LanceDBTableWrapper, { convertRecordToDBType } from './lanceTableWrapper'
import { DBEntry, DatabaseFields } from './schema'
import { Database } from 'lucide-react'

const convertFileTypeToDBType = async (table: LanceDBTableWrapper, file: FileInfo): Promise<DBEntry[]> => {
  const fileContent = readFile(file.path)
  const chunks = await chunkMarkdownByHeadingsAndByCharsIfBig(fileContent)
  const vectorEmbeddings: number[] = await table.getVectorForContent(fileContent)
  const entries = chunks.map((content, index) => ({
    notepath: file.path,
    vector: vectorEmbeddings,
    content,
    subnoteindex: index,
    timeadded: new Date(),
    filemodified: file.dateModified,
    filecreated: file.dateCreated,
  }))
  return entries
}

export const convertFileInfoListToDBItems = async (
  filesInfoList: FileInfo[],
  table: LanceDBTableWrapper,
): Promise<DBEntry[][]> => {
  const promises = filesInfoList.map((fileInfo: FileInfo) => convertFileTypeToDBType(table, fileInfo))
  const filesAsChunksToAddToDB = await Promise.all(promises)
  return filesAsChunksToAddToDB
}

const getTableAsArray = async (table: LanceDBTableWrapper): Promise<{ notepath: string; filemodified: Date }[]> => {
  const nonEmptyResults = await table.lanceTable
    .query()
    .where(`${DatabaseFields.NOTE_PATH} != ''`)
    .select([DatabaseFields.NOTE_PATH, DatabaseFields.FILE_MODIFIED, DatabaseFields.CONTENT])
    .toArray()

  const mapped = nonEmptyResults.map(convertRecordToDBType<DBEntry>)

  return mapped as { notepath: string; filemodified: Date }[]
}

const areChunksMissingFromTable = (
  chunksToCheck: DBEntry[],
  tableArray: { notepath: string; filemodified: Date }[],
): boolean => {
  // checking whether th
  if (chunksToCheck.length === 0) {
    // if there are no chunks and we are checking whether the table
    return false
  }

  if (chunksToCheck[0].content === '') {
    return false
  }
  // then we'd check if the filepaths are not present in the table at all:
  const { notepath } = chunksToCheck[0]
  const itemsAlreadyInTable = tableArray.filter((item) => item.notepath === notepath)
  if (itemsAlreadyInTable.length === 0) {
    // if we find no items in the table with the same notepath, then we should add the chunks to the table
    return true
  }

  return chunksToCheck[0].filemodified > itemsAlreadyInTable[0].filemodified
}

const computeDbItemsToAddOrUpdate = async (
  filesInfoList: FileInfo[],
  tableArray: { notepath: string; filemodified: Date }[],
  table: LanceDBTableWrapper,
): Promise<DBEntry[][]> => {
  const filesAsChunks = await convertFileInfoListToDBItems(filesInfoList, table)

  const fileChunksMissingFromTable = filesAsChunks.filter((chunksBelongingToFile) =>
    areChunksMissingFromTable(chunksBelongingToFile, tableArray),
  )

  return fileChunksMissingFromTable
}

const computeDBItemsToRemoveFromTable = async (
  filesInfoList: FileInfo[],
  tableArray: { notepath: string; filemodified: Date }[],
): Promise<{ notepath: string; filemodified: Date }[]> => {
  const itemsInTableAndNotInFilesInfoList = tableArray.filter(
    (item) => !filesInfoList.some((file) => file.path === item.notepath),
  )
  console.log(`Items in table and not in filesInfoList: `, itemsInTableAndNotInFilesInfoList)
  return itemsInTableAndNotInFilesInfoList
}

const convertFileTreeToDBEntries = async (tree: FileInfoTree, table: LanceDBTableWrapper): Promise<DBEntry[]> => {
  const flattened = flattenFileInfoTree(tree)

  // const promises = flattened.map(convertFileTypeToDBType)
  const promises = flattened.map((fileInfo: FileInfo) => convertFileTypeToDBType(table, fileInfo))

  const entries = await Promise.all(promises)

  return entries.flat()
}

export const removeFileTreeFromDBTable = async (
  dbTable: LanceDBTableWrapper,
  fileTree: FileInfoTree,
): Promise<void> => {
  const flattened = flattenFileInfoTree(fileTree)
  const filePaths = flattened.map((x) => x.path)
  await dbTable.deleteDBItemsByFilePaths(filePaths)
}

export const updateFileInTable = async (dbTable: LanceDBTableWrapper, filePath: string): Promise<void> => {
  console.log(`Inside updateFileInTable`)
  await dbTable.deleteDBItemsByFilePaths([filePath])
  const content = readFile(filePath)
  const chunkedContentList = await chunkMarkdownByHeadingsAndByCharsIfBig(content)
  const vectorEmbeddings: number[] = await dbTable.getVectorForContent(content)
  const stats = fs.statSync(filePath)
  const dbEntries = chunkedContentList.map((_content, index) => ({
    notepath: filePath,
    vector: vectorEmbeddings,
    content: _content,
    subnoteindex: index,
    timeadded: new Date(), // time now
    filemodified: stats.mtime,
    filecreated: stats.birthtime,
  }))
  await dbTable.add(dbEntries)
}

export const RepopulateTableWithMissingItems = async (
  table: LanceDBTableWrapper,
  directoryPath: string,
  onProgress?: (progress: number) => void,
) => {
  console.log(`Inside repopulateTableWithMissingItems`)
  const filesInfoTree = GetFilesInfoList(directoryPath)

  const tableArray = await getTableAsArray(table)
  console.log(`TableArray: `, tableArray)
  const itemsToRemove = await computeDBItemsToRemoveFromTable(filesInfoTree, tableArray)
  console.log(`ItemsToRemove: `, itemsToRemove)

  const filePathsToRemove = itemsToRemove.map((x) => x.notepath)
  await table.deleteDBItemsByFilePaths(filePathsToRemove)

  const dbItemsToAdd = await computeDbItemsToAddOrUpdate(filesInfoTree, tableArray, table)

  if (dbItemsToAdd.length === 0) {
    if (onProgress) onProgress(1)
    return
  }

  const flattenedItemsToAdd = dbItemsToAdd.flat()
  await table.add(flattenedItemsToAdd, onProgress)

  if (onProgress) onProgress(1)
}

export const addFileTreeToDBTable = async (dbTable: LanceDBTableWrapper, fileTree: FileInfoTree): Promise<void> => {
  console.log(`Inside add filetreeToDBTAble`)
  const dbEntries = await convertFileTreeToDBEntries(fileTree, dbTable)
  await dbTable.add(dbEntries)
}

export const orchestrateEntryMove = async (table: LanceDBTableWrapper, sourcePath: string, destinationPath: string) => {
  const fileSystemTree = GetFilesInfoTree(sourcePath)
  await removeFileTreeFromDBTable(table, fileSystemTree)
  moveFileOrDirectoryInFileSystem(sourcePath, destinationPath).then((newDestinationPath) => {
    if (newDestinationPath) {
      addFileTreeToDBTable(table, GetFilesInfoTree(newDestinationPath))
    }
  })
}

export function formatTimestampForLanceDB(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1 // getMonth() is zero-based
  const day = date.getDate()
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const seconds = date.getSeconds()

  // Pad single digits with leading zeros
  const monthPadded = month.toString().padStart(2, '0')
  const dayPadded = day.toString().padStart(2, '0')
  const hoursPadded = hours.toString().padStart(2, '0')
  const minutesPadded = minutes.toString().padStart(2, '0')
  const secondsPadded = seconds.toString().padStart(2, '0')

  return `timestamp '${year}-${monthPadded}-${dayPadded} ${hoursPadded}:${minutesPadded}:${secondsPadded}'`
}
