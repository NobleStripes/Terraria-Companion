import path from 'node:path'

export function isPathWithinDir(normalizedPath, dir) {
  return normalizedPath === dir || normalizedPath.startsWith(dir + path.sep)
}
