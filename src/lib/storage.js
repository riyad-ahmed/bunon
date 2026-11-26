/**
 * Safe localStorage helpers. Storage can be unavailable (private browsing,
 * blocked site data), so every access is guarded and falls back quietly.
 */
export function readJSON(key, fallback = null) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function writeJSON(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable — nothing to do
  }
}
