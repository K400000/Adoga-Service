// src/stores/session.js
import { computed } from 'vue'
import { db } from './db.js'
import { useRouter } from 'vue-router'

export function useSession() {
  const session = computed(() => db['adoga_current_session'])
  const isGuest = computed(() => !session.value)
  const isUser = computed(() => session.value?.role === 'user')
  const isManager = computed(() => session.value?.role === 'manager')
  const isAdmin = computed(() => session.value?.role === 'admin')

  return { session, isGuest, isUser, isManager, isAdmin }
}

// requireAuth — call before protected actions in UI
export function useRequireAuth() {
  const router = useRouter()
  const { isGuest } = useSession()

  return function requireAuth(next) {
    if (isGuest.value) {
      const path = router.currentRoute.value.fullPath
      router.push(`/auth?redirect=${encodeURIComponent(path)}&reason=login_required`)
      return false
    }
    if (next) next()
    return true
  }
}
