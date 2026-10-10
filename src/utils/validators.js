// src/utils/validators.js
export function validateEmail(email) {
  if (!email || !email.trim()) return { valid: false, message: 'กรุณากรอกอีเมล' }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!re.test(email.trim().toLowerCase())) return { valid: false, message: 'รูปแบบอีเมลไม่ถูกต้อง (เช่น name@example.com)' }
  return { valid: true, message: '' }
}

export function validateEmailUnique(email, users) {
  const r = validateEmail(email)
  if (!r.valid) return r
  const exists = users.some(u => u.email === email.trim().toLowerCase())
  if (exists) return { valid: false, message: 'อีเมลนี้ถูกใช้งานแล้ว' }
  return { valid: true, message: '' }
}

// Returns array of rule objects for live checklist
export function getPasswordRules(password) {
  return [
    { label: 'อย่างน้อย 8 ตัวอักษร',    pass: password.length >= 8 },
    { label: 'ตัวพิมพ์ใหญ่ (A-Z)',       pass: /[A-Z]/.test(password) },
    { label: 'ตัวพิมพ์เล็ก (a-z)',       pass: /[a-z]/.test(password) },
    { label: 'ตัวเลข (0-9)',             pass: /[0-9]/.test(password) },
    { label: 'ไม่มีช่องว่าง',            pass: !/\s/.test(password) && password.length > 0 },
  ]
}

export function validatePassword(password) {
  const rules = getPasswordRules(password)
  const failed = rules.find(r => !r.pass)
  if (failed) return { valid: false, message: failed.label }
  return { valid: true, message: '' }
}

export function validateName(name, label = 'ชื่อ') {
  if (!name || !name.trim()) return { valid: false, message: `กรุณากรอก${label}` }
  if (name.trim().length > 50) return { valid: false, message: `${label}ต้องไม่เกิน 50 ตัวอักษร` }
  return { valid: true, message: '' }
}
