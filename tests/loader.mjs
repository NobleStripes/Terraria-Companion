import { register } from 'node:module'

if (typeof globalThis.localStorage === 'undefined') {
	const store = new Map()

	globalThis.localStorage = {
		get length() {
			return store.size
		},
		clear() {
			store.clear()
		},
		getItem(key) {
			return store.has(key) ? store.get(key) : null
		},
		key(index) {
			if (!Number.isInteger(index) || index < 0 || index >= store.size) {
				return null
			}

			return Array.from(store.keys())[index] ?? null
		},
		removeItem(key) {
			store.delete(String(key))
		},
		setItem(key, value) {
			store.set(String(key), String(value))
		},
	}
}

register('./hooks.mjs', import.meta.url)
