export function extractFileNameFromFilePath(filePath: string) {
  const match = filePath.match(/[^\\/]+$/);
  return match ? match[0] : '';
}