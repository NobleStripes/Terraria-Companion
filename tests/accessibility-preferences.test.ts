import test from 'node:test'
import assert from 'node:assert/strict'
import {
  ACCESSIBILITY_PREFERENCES_CHANGED,
  readHighContrastPreference,
  readReducedMotionPreference,
  setHighContrastPreference,
  setReducedMotionPreference,
  syncAccessibilityPreferencesToDom,
} from '../src/lib/accessibilityPreferences.ts'

function createStorage(): Storage {
  const store = new Map<string, string>()

  return {
    get length() {
      return store.size
    },
    clear() {
      store.clear()
    },
    getItem(key: string) {
      return store.get(key) ?? null
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null
    },
    removeItem(key: string) {
      store.delete(key)
    },
    setItem(key: string, value: string) {
      store.set(key, value)
    },
  }
}

function setupDomHarness() {
  const previousWindow = (globalThis as { window?: unknown }).window
  const previousDocument = (globalThis as { document?: unknown }).document
  const previousCustomEvent = (globalThis as { CustomEvent?: unknown }).CustomEvent

  if (typeof globalThis.CustomEvent === 'undefined') {
    class CustomEventPolyfill<T = unknown> extends Event {
      detail?: T

      constructor(type: string, init?: CustomEventInit<T>) {
        super(type, init)
        this.detail = init?.detail
      }
    }

    Object.defineProperty(globalThis, 'CustomEvent', {
      configurable: true,
      value: CustomEventPolyfill,
      writable: true,
    })
  }

  const windowTarget = new EventTarget() as EventTarget & { localStorage: Storage }
  windowTarget.localStorage = createStorage()

  const documentMock = {
    documentElement: {
      dataset: {} as Record<string, string>,
    },
  }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: windowTarget,
    writable: true,
  })

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: documentMock,
    writable: true,
  })

  return {
    windowTarget,
    documentMock,
    restore() {
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: previousWindow,
        writable: true,
      })
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: previousDocument,
        writable: true,
      })
      Object.defineProperty(globalThis, 'CustomEvent', {
        configurable: true,
        value: previousCustomEvent,
        writable: true,
      })
    },
  }
}

test('preference readers and setters round-trip local storage and dataset', () => {
  const harness = setupDomHarness()

  assert.equal(readHighContrastPreference(), false)
  assert.equal(readReducedMotionPreference(), false)

  setHighContrastPreference(true)
  setReducedMotionPreference(true)

  assert.equal(readHighContrastPreference(), true)
  assert.equal(readReducedMotionPreference(), true)
  assert.equal(harness.documentMock.documentElement.dataset.contrast, 'high')
  assert.equal(harness.documentMock.documentElement.dataset.reducedMotion, 'true')

  setHighContrastPreference(false)
  setReducedMotionPreference(false)

  assert.equal(readHighContrastPreference(), false)
  assert.equal(readReducedMotionPreference(), false)
  assert.equal(harness.documentMock.documentElement.dataset.contrast, 'normal')
  assert.equal(harness.documentMock.documentElement.dataset.reducedMotion, 'false')

  harness.restore()
})

test('setters dispatch accessibility change event', () => {
  const harness = setupDomHarness()
  let eventCount = 0

  harness.windowTarget.addEventListener(ACCESSIBILITY_PREFERENCES_CHANGED, () => {
    eventCount += 1
  })

  setHighContrastPreference(true)
  setReducedMotionPreference(true)

  assert.equal(eventCount, 2)

  harness.restore()
})

test('syncAccessibilityPreferencesToDom applies stored values', () => {
  const harness = setupDomHarness()

  harness.windowTarget.localStorage.setItem('terra-high-contrast', '1')
  harness.windowTarget.localStorage.setItem('terra-reduced-motion', '0')

  syncAccessibilityPreferencesToDom()

  assert.equal(harness.documentMock.documentElement.dataset.contrast, 'high')
  assert.equal(harness.documentMock.documentElement.dataset.reducedMotion, 'false')

  harness.restore()
})
