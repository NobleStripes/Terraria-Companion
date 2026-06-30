import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { isPathWithinDir } from '../src/lib/serverPathGuard.mjs'

const root = path.sep + 'app'
const dir = path.join(root, 'dist')

test('server path guard: rejects sibling directory sharing name prefix', () => {
  assert.equal(isPathWithinDir(path.join(root, 'dist-evil', 'file.txt'), dir), false)
})

test('server path guard: rejects path that resolves outside dist via traversal', () => {
  assert.equal(isPathWithinDir(path.join(path.sep + 'etc', 'passwd'), dir), false)
})

test('server path guard: accepts file directly inside dist', () => {
  assert.equal(isPathWithinDir(path.join(dir, 'index.html'), dir), true)
})

test('server path guard: accepts file in nested subdirectory', () => {
  assert.equal(isPathWithinDir(path.join(dir, 'assets', 'main.js'), dir), true)
})

test('server path guard: accepts dist dir itself', () => {
  assert.equal(isPathWithinDir(dir, dir), true)
})

const symlinkSupported = (() => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'terraria-companion-path-guard-'))

  try {
    const distRoot = path.join(tempRoot, 'dist')
    const outsideFile = path.join(tempRoot, 'outside.txt')
    const linkedFile = path.join(distRoot, 'linked.txt')

    fs.mkdirSync(distRoot)
    fs.writeFileSync(outsideFile, 'outside')
    fs.symlinkSync(outsideFile, linkedFile)

    return isPathWithinDir(linkedFile, distRoot) === false
  } catch {
    return false
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true })
  }
})()

if (symlinkSupported) {
  test('server path guard: rejects symlink escape', () => {
    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'terraria-companion-path-guard-'))

    try {
      const distRoot = path.join(tempRoot, 'dist')
      const outsideFile = path.join(tempRoot, 'outside.txt')
      const linkedFile = path.join(distRoot, 'linked.txt')

      fs.mkdirSync(distRoot)
      fs.writeFileSync(outsideFile, 'outside')
      fs.symlinkSync(outsideFile, linkedFile)

      assert.equal(isPathWithinDir(linkedFile, distRoot), false)
    } finally {
      fs.rmSync(tempRoot, { recursive: true, force: true })
    }
  })
} else {
  test.skip('server path guard: rejects symlink escape')
}
