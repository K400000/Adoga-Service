// src/utils/storage.js — single parse/stringify point
export function get(key) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : null
  } catch { return null }
}

export function set(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function remove(key) {
  localStorage.removeItem(key)
}
