import * as path from 'path'

import { app, BrowserWindow, ipcMain } from 'electron'
import Store from 'electron-store'
import * as lancedb from 'vectordb'
import * as fs from 'fs'

import WindowsManager from '../common/windowManager'
import { getDefaultEmbeddingModelConfig } from '../electron-store/ipcHandlers'
import { StoreSchema } from '../electron-store/storeConfig'
import { startWatchingDirectory, updateFileListForRenderer } from '../filesystem/filesystem'

import { rerankSearchedEmbeddings } from './embeddings'
import { DBEntry, DatabaseFields } from './schema'
import { RepopulateTableWithMissingItems } from './tableHelperFunctions'
import DownloadModelFilesFromHFRepo from './downloadModelsFromHF'

export interface PromptWithRagResults {
  ragPrompt: string
  uniqueFilesReferenced: string[]
}

export interface BasePromptRequirements {
  query: string
  llmName: string
  filePathToBeUsedAsContext?: string
}

export const registerDBSessionHandlers = (store: Store<StoreSchema>, _windowManager: WindowsManager) => {
  let dbConnection: lancedb.Connection
  const windowManager = _windowManager

  ipcMain.handle('search', async (event, query: string, limit: number, filter?: string): Promise<DBEntry[]> => {
    const windowInfo = windowManager.getWindowInfoForContents(event.sender)
    if (!windowInfo) {
      throw new Error('Window info not found.')
    }
    const searchResults = await windowInfo.dbTableClient.search(query, limit, filter)
    return searchResults
  })

  ipcMain.handle('index-files-in-directory', async (event) => {
    try {
      const windowInfo = windowManager.getWindowInfoForContents(event.sender)
      if (!windowInfo) {
        throw new Error('No window info found')
      }
      const defaultEmbeddingModelConfig = getDefaultEmbeddingModelConfig(store)
      const dbPath = path.join(app.getPath('userData'), 'vectordb')
      dbConnection = await lancedb.connect(dbPath)
      await windowInfo.dbTableClient.initialize(
        dbConnection,
        windowInfo.vaultDirectoryForWindow,
        defaultEmbeddingModelConfig,
      )
      await RepopulateTableWithMissingItems(windowInfo.dbTableClient, windowInfo.vaultDirectoryForWindow, (progress) => {
        event.sender.send('indexing-progress', progress)
      })
      const win = BrowserWindow.fromWebContents(event.sender)
  
      if (win) {
        windowManager.watcher = startWatchingDirectory(win, windowInfo.vaultDirectoryForWindow)
        updateFileListForRenderer(win, windowInfo.vaultDirectoryForWindow)
      }
      event.sender.send('indexing-progress', 1)
    } catch (error) {
      console.error('Error indexing files in directory: ', error)
      event.sender.send('indexing-progress', 1)
    }
  })

  ipcMain.handle(
    'search-with-reranking',
    async (event, query: string, limit: number, filter?: string): Promise<DBEntry[]> => {
      const windowInfo = windowManager.getWindowInfoForContents(event.sender)
      if (!windowInfo) {
        throw new Error('Window info not found.')
      }
      const searchResults = await windowInfo.dbTableClient.search(query, limit, filter)

      const rankedResults = await rerankSearchedEmbeddings(query, searchResults)
      return rankedResults
    },
  )

  ipcMain.handle('get-database-fields', () => DatabaseFields)

  ipcMain.handle('re-download-embedding-model', async (event) => {
    try {
      const defaultEmbeddingModelConfig = getDefaultEmbeddingModelConfig(store)
      if (defaultEmbeddingModelConfig.type !== 'repo') {
        throw new Error('Only repo-based embedding models can be re-downloaded')
      }

      const modelPath = path.join(app.getPath('userData'), 'models', 'embeddings', defaultEmbeddingModelConfig.repoName)
      
      // Clear the existing model directory
      if (fs.existsSync(modelPath)) {
        console.log(`Clearing existing model directory: ${modelPath}`)
        fs.rmSync(modelPath, { recursive: true, force: true })
      }

      // Re-download the model
      const cacheDir = path.join(app.getPath('userData'), 'models', 'embeddings')
      console.log(`Re-downloading model: ${defaultEmbeddingModelConfig.repoName}`)
      await DownloadModelFilesFromHFRepo(defaultEmbeddingModelConfig.repoName, cacheDir)
      
      event.sender.send('embedding-model-re-downloaded', true)
    } catch (error) {
      console.error('Error re-downloading embedding model:', error)
      event.sender.send('embedding-model-re-downloaded', false, error instanceof Error ? error.message : String(error))
    }
  })
}
