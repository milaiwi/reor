import path from 'path-browserify';

/* Normalizes paths according to platform conventions:
* - Windows: uses backslashes
* - macOS/Linux: uses forward slashes
* - Also resolves '.', '..', and duplicate slashes
*/
export function normalizePath(p: string): string {
  if (!p) return p

  // Convert backslashes to forward slashes
  let normalized = p.replace(/\\/g, '/')

  // Remove duplicate slashes (except after drive letter)
  normalized = normalized.replace(/\/+/g, '/')

  // Uppercase drive letter on Windows (e.g., c:/ → C:/)
  const winDriveMatch = normalized.match(/^([a-zA-Z]):\//)
  if (winDriveMatch) {
    normalized = winDriveMatch[1].toUpperCase() + normalized.substring(1)
  }

  // Remove trailing slash (unless it's root like C:/ or /)
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Adds a default extension if the filename has no Markdown extension.
 */
export function addExtensionIfNoExtensionPresent(
  fileName: string,
  defaultExtension: string = '.md'
): string {
  const extension = path.extname(fileName).toLowerCase();
  if (['.md', '.markdown', '.mdown', '.mkdn', '.mkd'].includes(extension)) {
    return fileName;
  }
  return `${fileName}${defaultExtension.startsWith('.') ? defaultExtension : '.' + defaultExtension}`;
}

/**
 * Extracts the file extension from a path.
 */
export function extractExtensionName(filePath: string): string {
  return path.extname(normalizePath(filePath));
}

/**
 * Returns an absolute normalized path.
 */
export function extractAbsolutePath(filePath: string): string {
  return normalizePath(path.resolve(normalizePath(filePath)));
}

/**
 * Checks if a path is absolute.
 */
export function isPathAbsolute(filePath: string): boolean {
  const normalized = normalizePath(filePath);
  // Windows drive letter or UNC path or POSIX root
  return /^[A-Za-z]:\//.test(normalized) || normalized.startsWith('//') || normalized.startsWith('/');
}

/**
 * Returns the relative path from one file to another.
 */
export function getRelativePath(from: string, to: string): string {
  return normalizePath(path.relative(normalizePath(from), normalizePath(to)));
}

/**
 * Gets the parent directory of a file.
 */
export function getDirname(filePath: string): string {
  console.log(`inside getDirName: ${path.dirname(normalizePath(filePath))} for ${filePath}`)
  return normalizePath(path.dirname(normalizePath(filePath)));
}

/**
 * Joins multiple paths together, ensuring slash normalization.
 */
export function joinPaths(...args: string[]): string {
  const normalizedArgs = args.map(arg => arg ? normalizePath(arg) : arg);
  return normalizePath(path.join(...normalizedArgs));
}

/**
 * Returns the platform-specific path separator (always POSIX in path-browserify).
 * Note: In the browser, this is always '/' regardless of platform.
 */
export function getPlatformSpecificSep(): string {
  return '/';
}

/**
 * Returns the last part of a path (the filename or last directory).
 */
export function getPathBasename(filePath: string): string {
  return path.basename(normalizePath(filePath));
}

/**
 * 
 * @returns Returns the platform user is on
 */
export function getPlatform(): 'windows' | 'macos' | 'linux' | 'unknown' {
  const ua = navigator.userAgent.toLowerCase()

  if (ua.includes('win')) return 'windows'
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('linux')) return 'linux'

  return 'unknown'
}

/**
 * Compares two paths in a case-sensitive or case-insensitive manner depending on platform.
 * Defaults to smart detection.
 */
export function arePathsEqual(a: string, b: string, forceCase: boolean = false): boolean {
  const normalizedA = normalizePath(a);
  const normalizedB = normalizePath(b);
  
  // Force case-sensitive comparison if requested
  if (forceCase) {
    return normalizedA === normalizedB;
  }

  // Case-sensitive for Linux and other platforms
  return normalizedA === normalizedB;
}

/**
 * Converts a file path to a file:// URL
 */
export function pathToFileURL(p: string): string {
  const normalized = normalizePath(p);
  
  // Handle Windows drive letters specially
  if (/^[A-Z]:\//.test(normalized)) {
    return `file:///${normalized}`;
  }
  
  // Standard path
  return `file://${normalized.startsWith('/') ? normalized : '/' + normalized}`;
}

/**
 * Gets the volume name from a path (e.g., "C:" on Windows, or empty string on POSIX)
 */
export function getVolume(p: string): string {
  const normalized = normalizePath(p);
  const match = normalized.match(/^([A-Za-z]:)\//);
  return match ? match[1] : '';
}