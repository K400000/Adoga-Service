// src/stores/db.js — reactive store + auto-persist to localStorage
import { reactive, watch } from 'vue'
import { get, set } from '../utils/storage.js'

const KEYS = [
  'adoga_users', 'adoga_hotels', 'adoga_bookings',
  'adoga_refunds', 'adoga_reviews', 'adoga_messages',
  'adoga_settings', 'adoga_current_session', 'adoga_meta',
]

// Load initial data from localStorage
function loadAll() {
  const result = {}
  for (const k of KEYS) {
    result[k] = get(k)
  }
  return result
}

export const db = reactive(loadAll())

// Auto-persist on change
watch(db, (val) => {
  for (const k of KEYS) {
    if (val[k] !== undefined) set(k, val[k])
  }
}, { deep: true })

// Helpers: always operate through these
export function getUsers()    { return db['adoga_users'] || [] }
export function getHotels()   { return db['adoga_hotels'] || [] }
export function getBookings() { return db['adoga_bookings'] || [] }
export function getRefunds()  { return db['adoga_refunds'] || [] }
export function getReviews()  { return db['adoga_reviews'] || [] }
export function getMessages() { return db['adoga_messages'] || [] }
export function getSettings() { return db['adoga_settings'] || { enableRefund: true } }
export function getSession()  { return db['adoga_current_session'] || null }
