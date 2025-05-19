import { markdownExtensions } from "electron/main/filesystem/filesystem";
import path from 'path-browserify'

export function extractFileNameFromFilePath(filePath: string) {
  const match = filePath.match(/[^\\/]+$/);
  return match ? match[0] : '';
}

export function addExtensionIfNoExtensionPresent(
  fileName: string,
  defaultExtension: string = 'md',
) {
  const extension = path.extname(fileName).toLowerCase()
  if (markdownExtensions.includes(extension)) {
    return fileName
  }
  return `${fileName}${defaultExtension}`
}

export function extractExtensionName(filePath: string) {
  return path.extname(filePath)
}

export function extractAbsolutePath(filePath: string) {
  return path.resolve(filePath)
}

export function isPathAbsolute(filePath: string) {
  return path.isAbsolute(filePath)
}

export function getRelativePath(from: string, to: string) {
  return path.relative(from, to)
}

export function getDirname(filePath: string) {
  return path.dirname(filePath)
}

export function joinPaths(...args: any) {
  return path.join(...args)
}

export function getPlatformSpecificSep() {
  return path.sep
}

export function getPathBasename(filePath: string) {
  return path.basename(filePath)
}