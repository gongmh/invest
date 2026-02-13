<template>
  <Transition name="toast">
    <div v-if="visible" :class="['toast', type]">
      <span class="toast-icon">{{ icon }}</span>
      <span class="toast-message">{{ message }}</span>
    </div>
  </Transition>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'Toast',
  setup() {
    const visible = ref(false)
    const message = ref('')
    const type = ref('error')

    const icon = computed(() => {
      switch (type.value) {
        case 'success': return '✓'
        case 'error': return '✕'
        case 'warning': return '⚠'
        default: return 'ℹ'
      }
    })

    const show = (msg, duration = 3000, toastType = 'error') => {
      message.value = msg
      type.value = toastType
      visible.value = true
      
      setTimeout(() => {
        visible.value = false
      }, duration)
    }

    return {
      visible,
      message,
      type,
      icon,
      show
    }
  }
}
</script>

<style scoped>
.toast {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 24px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  font-size: 14px;
  font-weight: 500;
}

.toast.error {
  background-color: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.toast.success {
  background-color: #f0fdf4;
  color: #16a34a;
  border: 1px solid #bbf7d0;
}

.toast.warning {
  background-color: #fffbeb;
  color: #d97706;
  border: 1px solid #fde68a;
}

.toast-icon {
  font-size: 16px;
  font-weight: bold;
}

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-20px);
}
</style>
