// src/utils/date.js
export const now = () => new Date()
export const addHours = (n) => { const d = new Date(); d.setTime(d.getTime() + n * 3600000); return d }
export const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d }

export function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function formatPrice(amount) {
  return new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)
}

export function countdown(expiresAt) {
  const diff = new Date(expiresAt) - new Date()
  if (diff <= 0) return { expired: true, text: '00:00:00', urgent: true }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  const pad = n => String(n).padStart(2, '0')
  return {
    expired: false,
    text: `${pad(h)}:${pad(m)}:${pad(s)}`,
    urgent: diff <= 15 * 60 * 1000,
    warn: diff <= 2 * 3600000,
  }
}
