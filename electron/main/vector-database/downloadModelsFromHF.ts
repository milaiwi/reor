import fs from 'fs'
import * as path from 'path'

import { listFiles, downloadFile } from '@huggingface/hub'

import customFetchUsingElectronNet from '../common/network'

async function downloadAndSaveFile(repo: string, HFFilePath: string, systemFilePath: string): Promise<void> {
  // Call the downloadFile function and await its result
  const res = await downloadFile({
    repo,
    path: HFFilePath,
    fetch: customFetchUsingElectronNet,
  })

  if (!res) {
    throw new Error(`Failed to download file from ${repo}/${HFFilePath}`)
  }

  // Convert the Response object to an ArrayBuffer
  const arrayBuffer = await res.arrayBuffer()

  // Convert the ArrayBuffer to a Buffer
  const buffer = Buffer.from(arrayBuffer)

  // Join the systemFilePath and filePath to create the full path
  const fullPath = path.join(systemFilePath, HFFilePath)
  const directory = path.dirname(fullPath)
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true })
  }
  // Save the Buffer to the full path
  fs.writeFileSync(fullPath, buffer)
}

const DownloadModelFilesFromHFRepo = async (repo: string, saveDirectory: string, quantized = true) => {
  console.log(`Starting download for repo: ${repo} to directory: ${saveDirectory}`)
  
  try {
    // List the files:
    console.log(`Listing files for repo: ${repo}`)
    const fileList = await listFiles({
      repo,
      recursive: true,
      fetch: customFetchUsingElectronNet,
    })

    const files = []
    for await (const file of fileList) {
      if (file.type === 'file') {
        if (file.path.endsWith('onnx')) {
          const isQuantizedFile = file.path.includes('quantized')
          if (quantized === isQuantizedFile) {
            files.push(file)
          }
        } else {
          files.push(file)
        }
      }
    }

    console.log(`Found ${files.length} files to download for repo: ${repo}`)
    console.log('Files to download:', files.map(f => f.path))

    if (files.length === 0) {
      throw new Error(`No files found to download for repo: ${repo}`)
    }

    // Create an array of promises for each file download:
    const downloadPromises = files.map((file) => downloadAndSaveFile(repo, file.path, path.join(saveDirectory, repo)))

    // Execute all download promises in parallel:
    await Promise.all(downloadPromises)
    console.log(`Successfully downloaded all files for repo: ${repo}`)
  } catch (error) {
    console.error(`Error downloading files for repo ${repo}:`, error)
    throw error
  }
}

export default DownloadModelFilesFromHFRepo
