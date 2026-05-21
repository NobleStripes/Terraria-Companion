import { resolve as resolvePath } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

const hooksDir = fileURLToPath(new URL('.', import.meta.url))
const srcDir = resolvePath(hooksDir, '..', 'src')

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2)
    const base = resolvePath(srcDir, rel)
    const candidates = [base + '.ts', resolvePath(base, 'index.ts')]
    for (const candidate of candidates) {
      if (existsSync(candidate)) {
        return { shortCircuit: true, url: pathToFileURL(candidate).href }
      }
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (url.endsWith('.json')) {
    const source = readFileSync(fileURLToPath(url), 'utf8')
    return { format: 'json', source, shortCircuit: true }
  }
  return nextLoad(url, context)
}
