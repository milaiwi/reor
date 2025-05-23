import * as fs from 'fs'
import * as fsPromises from 'fs/promises'
import path from 'path'

import { BrowserWindow } from 'electron'
import { chunkMarkdownByBlocksAndByCharsIfBig } from '../common/chunking'
import {
  GetFilesInfoList,
  flattenFileInfoTree,
  readFile,
  updateFileListForRenderer,
  startWatchingDirectory,
} from '../filesystem/filesystem'
import { FileInfo, FileInfoTree, RenameFileProps } from '../filesystem/types'

import LanceDBTableWrapper, { convertRecordToDBType } from './lanceTableWrapper'
import { DBEntry, DatabaseFields } from './schema'
import WindowsManager from '../common/windowManager'

const convertFileTypeToDBType = async (file: FileInfo): Promise<DBEntry[]> => {
  const fileContent = readFile(file.path)
  const chunks = await chunkMarkdownByBlocksAndByCharsIfBig(fileContent)
  const entries = chunks.map((block, index) => ({
    name: file.name,
    notepath: file.path,
    content: block.content,
    subnoteindex: index,
    timeadded: new Date(),
    filemodified: file.dateModified,
    filecreated: file.dateCreated,
    headingContext: block.headingContext,
    blockStartingPos: block.startingPos,
  }))
  return entries
}

export const handleFileRename = async (
  windowsManager: WindowsManager,
  windowInfo: { vaultDirectoryForWindow: string; dbTableClient: any },
  renameFileProps: RenameFileProps,
  sender: Electron.WebContents,
): Promise<void> => {
  windowsManager.watcher?.unwatch(windowInfo.vaultDirectoryForWindow)

  try {
    await fsPromises.access(renameFileProps.newFilePath)
    throw new Error(`A file already exists at destination: ${renameFileProps.newFilePath}`)
  } catch (error) {
    // If error is ENOENT (file doesn't exist), proceed with rename
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error
    }
  }

  if (process.platform === 'win32') {
    await windowsManager.watcher?.close()
    await new Promise<void>((resolve, reject) => {
      fs.rename(renameFileProps.oldFilePath, renameFileProps.newFilePath, (err) => {
        if (err) {
          reject(err)
          return
        }

        const win = BrowserWindow.fromWebContents(sender)
        if (win) {
          // eslint-disable-next-line no-param-reassign
          windowsManager.watcher = startWatchingDirectory(win, windowInfo.vaultDirectoryForWindow)
          updateFileListForRenderer(win, windowInfo.vaultDirectoryForWindow)
        }
        resolve()
      })
    })
  } else {
    await new Promise<void>((resolve, reject) => {
      fs.rename(renameFileProps.oldFilePath, renameFileProps.newFilePath, (err) => {
        if (err) {
          reject(err)
          return
        }
        windowsManager.watcher?.add(windowInfo.vaultDirectoryForWindow)
        resolve()
      })
    })
  }

  await windowInfo.dbTableClient.updateDBItemsWithNewFilePath(renameFileProps.oldFilePath, renameFileProps.newFilePath)
}

export const convertFileInfoListToDBItems = async (filesInfoList: FileInfo[]): Promise<DBEntry[][]> => {
  const promises = filesInfoList.map(convertFileTypeToDBType)
  const filesAsChunksToAddToDB = await Promise.all(promises)
  return filesAsChunksToAddToDB
}

const getTableAsArray = async (table: LanceDBTableWrapper): Promise<{ notepath: string; filemodified: Date }[]> => {
  const nonEmptyResults = await table.lanceTable
    .filter(`${DatabaseFields.NOTE_PATH} != ''`)
    .select([DatabaseFields.NOTE_PATH, DatabaseFields.FILE_MODIFIED])
    .execute()

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
): Promise<DBEntry[][]> => {
  const filesAsChunks = await convertFileInfoListToDBItems(filesInfoList)

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
  return itemsInTableAndNotInFilesInfoList
}

const convertFileTreeToDBEntries = async (tree: FileInfoTree): Promise<DBEntry[]> => {
  const flattened = flattenFileInfoTree(tree)

  const promises = flattened.map(convertFileTypeToDBType)

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
  await dbTable.deleteDBItemsByFilePaths([filePath])
  const content = readFile(filePath)
  const chunkedContentList = await chunkMarkdownByBlocksAndByCharsIfBig(content)
  const fileName = path.basename(filePath).split('.')[0]
  const stats = fs.statSync(filePath)
  const dbEntries = chunkedContentList.map((block, index) => ({
    name: fileName,
    notepath: filePath,
    content: block.content,
    subnoteindex: index,
    timeadded: new Date(),
    filemodified: stats.mtime,
    filecreated: stats.birthtime,
    headingContext: block.headingContext,
    blockStartingPos: block.startingPos,
  }))
  await dbTable.add(dbEntries)
}

export const RepopulateTableWithMissingItems = async (
  table: LanceDBTableWrapper,
  directoryPath: string,
  onProgress?: (progress: number) => void,
) => {
  const filesInfoTree = GetFilesInfoList(directoryPath)

  const tableArray = await getTableAsArray(table)
  const itemsToRemove = await computeDBItemsToRemoveFromTable(filesInfoTree, tableArray)

  const filePathsToRemove = itemsToRemove.map((x) => x.notepath)
  await table.deleteDBItemsByFilePaths(filePathsToRemove)

  const dbItemsToAdd = await computeDbItemsToAddOrUpdate(filesInfoTree, tableArray)

  if (dbItemsToAdd.length === 0) {
    if (onProgress) onProgress(1)
    return
  }

  const flattenedItemsToAdd = dbItemsToAdd.flat()
  await table.add(flattenedItemsToAdd, onProgress)

  if (onProgress) onProgress(1)
}

export const addFileTreeToDBTable = async (dbTable: LanceDBTableWrapper, fileTree: FileInfoTree): Promise<void> => {
  const dbEntries = await convertFileTreeToDBEntries(fileTree)
  await dbTable.add(dbEntries)
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
