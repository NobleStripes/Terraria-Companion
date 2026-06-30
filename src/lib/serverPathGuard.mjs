import fs from 'node:fs'
import path from 'node:path'

function resolvePathForComparison(candidatePath) {
  try {
    return fs.realpathSync(candidatePath)
  } catch {
    return path.resolve(candidatePath)
  }
}

export function isPathWithinDir(candidatePath, dir) {
  const resolvedDir = resolvePathForComparison(dir)
  const resolvedCandidate = resolvePathForComparison(candidatePath)
  const relativePath = path.relative(resolvedDir, resolvedCandidate)

  return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath))
}
