<template>
  <div class="friend-request">
    <div class="request-info">
      <img :src="avatarUrl" :alt="request.username" />
      <div class="request-details">
        <h4>{{ request.username }}</h4>
        <p v-if="request.message" class="request-message">"{{ request.message }}"</p>
        <p class="request-time">{{ formatDate(request.createTime) }}</p>
      </div>
    </div>
    <div class="request-actions">
      <button 
        class="btn-primary" 
        @click="$emit('accept', request.id)"
        :disabled="loading"
      >
        {{ loading ? '处理中...' : '接受' }}
      </button>
      <button 
        class="btn-secondary" 
        @click="$emit('reject', request.id)"
        :disabled="loading"
      >
        拒绝
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  request: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
})

defineEmits(['accept', 'reject'])

// 计算头像URL
const avatarUrl = computed(() => {
  return '/default-avatar.png'
})

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.friend-request {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: white;
  border-radius: 8px;
  margin-bottom: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.friend-request:hover {
  transform: translateX(5px);
}

.request-info {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: 1;
}

.request-info img {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.request-details {
  flex: 1;
}

.request-details h4 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 16px;
}

.request-message {
  margin: 0 0 5px 0;
  color: #666;
  font-size: 14px;
  font-style: italic;
}

.request-time {
  margin: 0;
  color: #999;
  font-size: 12px;
}

.request-actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.btn-primary,
.btn-secondary {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #e0e0e0;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
