export const ACCESSIBILITY_PREFERENCES_CHANGED = 'terra:accessibility-preferences-changed'

const HIGH_CONTRAST_KEY = 'terra-high-contrast'
const REDUCED_MOTION_KEY = 'terra-reduced-motion'

export function readHighContrastPreference(): boolean {
  return window.localStorage.getItem(HIGH_CONTRAST_KEY) === '1'
}

export function readReducedMotionPreference(): boolean {
  return window.localStorage.getItem(REDUCED_MOTION_KEY) === '1'
}

export function setHighContrastPreference(enabled: boolean) {
  window.localStorage.setItem(HIGH_CONTRAST_KEY, enabled ? '1' : '0')
  document.documentElement.dataset.contrast = enabled ? 'high' : 'normal'
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_PREFERENCES_CHANGED))
}

export function setReducedMotionPreference(enabled: boolean) {
  window.localStorage.setItem(REDUCED_MOTION_KEY, enabled ? '1' : '0')
  document.documentElement.dataset.reducedMotion = enabled ? 'true' : 'false'
  window.dispatchEvent(new CustomEvent(ACCESSIBILITY_PREFERENCES_CHANGED))
}

export function syncAccessibilityPreferencesToDom() {
  document.documentElement.dataset.contrast = readHighContrastPreference() ? 'high' : 'normal'
  document.documentElement.dataset.reducedMotion = readReducedMotionPreference() ? 'true' : 'false'
}
