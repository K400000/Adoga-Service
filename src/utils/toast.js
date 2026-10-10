import { ref } from 'vue'

export const toasts = ref([])
let nextId = 0

export function showToast(message, type = 'success', duration = 4000) {
  const id = ++nextId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

export function dismissToast(id) {
  toasts.value = toasts.value.filter(t => t.id !== id)
}
