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

export function thaiBahtText(amount) {
  if (isNaN(amount) || amount === 0) return 'ศูนย์บาทถ้วน'
  const numbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า']
  const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน']
  const str = Math.round(amount).toString()
  const len = str.length
  let result = ''
  for (let i = 0; i < len; i++) {
    const digit = parseInt(str.charAt(i))
    const pos = len - i - 1
    if (digit !== 0) {
      if (pos === 1 && digit === 1) {
        result += 'สิบ'
      } else if (pos === 1 && digit === 2) {
        result += 'ยี่สิบ'
      } else if (pos === 0 && digit === 1 && len > 1 && parseInt(str.charAt(i - 1)) !== 0) {
        result += 'เอ็ด'
      } else {
        result += numbers[digit] + positions[pos]
      }
    }
  }
  return result + 'บาทถ้วน'
}
