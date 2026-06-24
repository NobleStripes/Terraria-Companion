import test from 'node:test'
import assert from 'node:assert/strict'
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
