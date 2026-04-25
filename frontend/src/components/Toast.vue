<template>
  <transition-group name="toast" tag="div" class="toast-container">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      :class="['toast', `toast-${toast.type}`]"
    >
      <div class="toast-icon">
        <span v-if="toast.type === 'success'">✓</span>
        <span v-else-if="toast.type === 'error'">✕</span>
        <span v-else-if="toast.type === 'warning'">!</span>
        <span v-else>i</span>
      </div>
      <div class="toast-content">
        <div class="toast-message">{{ toast.message }}</div>
      </div>
      <button class="toast-close" @click="removeToast(toast.id)">×</button>
    </div>
  </transition-group>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

const addToast = (message, type = 'info', duration = 3000) => {
  const id = ++toastId
  toasts.value.push({ id, message, type })

  if (duration > 0) {
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }

  return id
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index > -1) {
    toasts.value.splice(index, 1)
  }
}

// 暴露方法给外部使用
defineExpose({
  addToast,
  removeToast
})
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.toast {
  min-width: 300px;
  max-width: 400px;
  padding: 12px 16px;
  border-radius: 4px;
  background: white;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideIn 0.3s ease;
}

.toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.toast-success .toast-icon {
  background-color: #f0f9ff;
  color: #67c23a;
}

.toast-error .toast-icon {
  background-color: #fef0f0;
  color: #f56c6c;
}

.toast-warning .toast-icon {
  background-color: #fdf6ec;
  color: #e6a23c;
}

.toast-info .toast-icon {
  background-color: #f4f4f5;
  color: #909399;
}

.toast-content {
  flex: 1;
  font-size: 14px;
  color: #606266;
}

.toast-close {
  background: none;
  border: none;
  font-size: 16px;
  color: #909399;
  cursor: pointer;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.3s;
}

.toast-close:hover {
  background-color: #f5f5f5;
  color: #606266;
}

@keyframes slideIn {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideOut {
  from {
    transform: translateY(0);
    opacity: 1;
  }
  to {
    transform: translateY(-20px);
    opacity: 0;
  }
}
</style>
