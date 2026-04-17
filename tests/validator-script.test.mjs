import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('data validator script exits cleanly', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-items.mjs'], {
    cwd: repoRoot,
    encoding: 'utf8',
  })

  assert.equal(result.status, 0, result.stderr || result.stdout)
})
