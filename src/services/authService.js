// src/services/authService.js
import { db } from '../stores/db.js'
import { set } from '../utils/storage.js'
import { validateEmailUnique, validatePassword, validateName } from '../utils/validators.js'

function nextId(role) {
  const prefix = { user: 'U', manager: 'M', admin: 'A' }[role]
  const users = db['adoga_users'] || []
  const nums = users.filter(u => u.id.startsWith(prefix)).map(u => parseInt(u.id.slice(1)) || 0)
  return prefix + String(Math.max(0, ...nums) + 1).padStart(3, '0')
}

export function register({ email, password, firstName, lastName, nickname, phone, birthdate, role, provider = 'local' }) {
  const users = db['adoga_users'] || []
  const emailVal = validateEmailUnique(email, users)
  if (!emailVal.valid) return { ok: false, message: emailVal.message }
  const pwVal = validatePassword(password)
  if (!pwVal.valid) return { ok: false, message: pwVal.message }
  const fnVal = validateName(firstName, 'ชื่อ')
  if (!fnVal.valid) return { ok: false, message: fnVal.message }
  const lnVal = validateName(lastName, 'นามสกุล')
  if (!lnVal.valid) return { ok: false, message: lnVal.message }
  if (!role) return { ok: false, message: 'กรุณาเลือกบทบาท' }

  const user = {
    id: nextId(role),
    email: email.trim().toLowerCase(),
    password,
    role,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    nickname: nickname?.trim() || firstName.trim(),
    phone: phone?.trim() || '',
    birthdate: birthdate || '',
    provider,
    createdAt: new Date().toISOString(),
  }
  db['adoga_users'] = [...users, user]
  return { ok: true, user }
}

export function login(email, password) {
  const users = db['adoga_users'] || []
  const cleanEmail = email.trim().toLowerCase()
  const user = users.find(u => 
    u.email === cleanEmail ||
    (cleanEmail === 'hotel@domain.com' && u.email === 'manager@gmail.com') ||
    (cleanEmail === 'manager@gmail.com' && u.email === 'hotel@domain.com') ||
    (cleanEmail === 'hotel2@domain.com' && u.email === 'manager2@gmail.com') ||
    (cleanEmail === 'manager2@gmail.com' && u.email === 'hotel2@domain.com') ||
    (cleanEmail === 'admin@adoga.com' && u.email === 'admin@gmail.com') ||
    (cleanEmail === 'admin@gmail.com' && u.email === 'admin@adoga.com')
  )
  if (!user) return { ok: false, message: 'ไม่พบอีเมลนี้ในระบบ กรุณาลงทะเบียน' }
  if (user.password !== password) return { ok: false, message: 'รหัสผ่านไม่ถูกต้อง' }
  if (user.disabled || user.status === 'disabled') {
    return { ok: false, message: 'คุณไม่มีสิทธิ์เข้าใช้งานในระบบ' }
  }
  const session = { userId: user.id, role: user.role }
  db['adoga_current_session'] = session
  return { ok: true, session, user }
}

export function loginWithGoogleEmail(email) {
  const users = db['adoga_users'] || []
  const cleanEmail = email.trim().toLowerCase()
  let user = users.find(u => 
    u.email === cleanEmail ||
    (cleanEmail === 'hotel@domain.com' && u.email === 'manager@gmail.com') ||
    (cleanEmail === 'manager@gmail.com' && u.email === 'hotel@domain.com') ||
    (cleanEmail === 'hotel2@domain.com' && u.email === 'manager2@gmail.com') ||
    (cleanEmail === 'manager2@gmail.com' && u.email === 'hotel2@domain.com') ||
    (cleanEmail === 'admin@adoga.com' && u.email === 'admin@gmail.com') ||
    (cleanEmail === 'admin@gmail.com' && u.email === 'admin@adoga.com')
  )
  if (!user) {
    const emailPrefix = cleanEmail.split('@')[0] || 'User'
    const formattedName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1)
    
    let detectedRole = 'user'
    if (cleanEmail.includes('admin')) {
      detectedRole = 'admin'
    } else if (cleanEmail.includes('manager')) {
      detectedRole = 'manager'
    }

    user = {
      id: nextId(detectedRole),
      email: cleanEmail,
      password: '',
      role: detectedRole,
      firstName: formattedName,
      lastName: '',
      nickname: formattedName,
      phone: '',
      birthdate: '',
      provider: 'google',
      status: 'active',
      createdAt: new Date().toISOString(),
    }
    db['adoga_users'] = [...users, user]
  }
  if (user.disabled || user.status === 'disabled') {
    return { ok: false, message: 'คุณไม่มีสิทธิ์เข้าใช้งานในระบบ' }
  }
  const session = { userId: user.id, role: user.role }
  db['adoga_current_session'] = session
  return { ok: true, session, user }
}

export function toggleUserAccess(userId, enabled) {
  const users = [...(db['adoga_users'] || [])]
  const idx = users.findIndex(u => u.id === userId)
  if (idx === -1) return { ok: false, message: 'ไม่พบบัญชีผู้ใช้' }
  users[idx] = { ...users[idx], disabled: !enabled, status: enabled ? 'active' : 'disabled' }
  db['adoga_users'] = users
  return { ok: true, user: users[idx] }
}

export function logout() {
  db['adoga_current_session'] = null
}

export function resetPassword(email, newPassword) {
  const users = db['adoga_users'] || []
  const idx = users.findIndex(u => u.email === email.trim().toLowerCase())
  if (idx === -1) return { ok: false, message: 'ไม่พบอีเมลนี้ในระบบ' }
  const pwVal = validatePassword(newPassword)
  if (!pwVal.valid) return { ok: false, message: pwVal.message }
  users[idx] = { ...users[idx], password: newPassword }
  db['adoga_users'] = users
  return { ok: true }
}

export function getCurrentUser() {
  const session = db['adoga_current_session']
  if (!session) return null
  const users = db['adoga_users'] || []
  return users.find(u => u.id === session.userId) || null
}
