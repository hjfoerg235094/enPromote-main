<template>
  <div class="friend-ranking">
    <div class="ranking-header">
      <h2>好友排行榜</h2>
      <div class="ranking-tabs">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          :class="['tab-button', { active: currentTab === tab.value }]"
          @click="switchTab(tab.value)"
        >
          {{ tab.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="ranking.length === 0" class="empty">
      <div class="empty-icon">🏆</div>
      <p>暂无排行榜数据</p>
    </div>

    <div v-else class="ranking-list">
      <div
        v-for="user in ranking"
        :key="user.id"
        :class="['ranking-item', { 'current-user': user.isCurrentUser }]"
      >
        <div class="rank" :class="getRankClass(user.rank)">
          {{ user.rank }}
        </div>
        <div class="user-info">
          <img :src="getAvatarUrl(user.avatar)" :alt="user.username" />
          <div>
            <h4>{{ user.username }}</h4>
            <p v-if="user.isCurrentUser" class="current-user-label">我</p>
          </div>
        </div>
        <div class="score">
          <span class="score-value">{{ getScoreValue(user) }}</span>
          <span class="score-label">{{ getScoreLabel() }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getFriendRanking } from '@/api/friend'

interface RankingUser {
  rank: number
  id: string
  username: string
  avatar: string
  totalWords: number
  todayWords: number
  streakDays: number
  isCurrentUser: boolean
}

const tabs: { label: string; value: 'totalWords' | 'todayWords' | 'streakDays' }[] = [
  { label: '总词汇量', value: 'totalWords' },
  { label: '今日学习', value: 'todayWords' },
  { label: '连续天数', value: 'streakDays' }
]

const currentTab = ref<'totalWords' | 'todayWords' | 'streakDays'>('totalWords')
const ranking = ref<RankingUser[]>([])
const loading = ref(false)

// 获取头像URL
const getAvatarUrl = (avatarPath: string) => {
  if (!avatarPath || avatarPath === '/default-avatar.png') {
    return 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  }
  if (avatarPath.startsWith('http')) {
    return avatarPath
  }
  if (!avatarPath.startsWith('/avatars/')) {
    return '/avatars/' + avatarPath.replace(/^\/+/, '')
  }
  return avatarPath
}

// 获取排名样式类
const getRankClass = (rank: number) => {
  if (rank === 1) return 'rank-1'
  if (rank === 2) return 'rank-2'
  if (rank === 3) return 'rank-3'
  return ''
}

// 获取分数值
const getScoreValue = (user: RankingUser) => {
  switch (currentTab.value) {
    case 'todayWords':
      return user.todayWords
    case 'streakDays':
      return user.streakDays
    default:
      return user.totalWords
  }
}

// 获取分数标签
const getScoreLabel = () => {
  switch (currentTab.value) {
    case 'todayWords':
      return '个单词'
    case 'streakDays':
      return '天'
    default:
      return '个单词'
  }
}

// 切换标签
const switchTab = (tab: 'totalWords' | 'todayWords' | 'streakDays') => {
  currentTab.value = tab
  fetchRanking()
}

// 获取排行榜数据
const fetchRanking = async () => {
  try {
    loading.value = true
    const res = await getFriendRanking(currentTab.value)
    if (res.data.code === 200) {
      ranking.value = res.data.data || []
    }
  } catch (error) {
    console.error('获取排行榜失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRanking()
})
</script>

<style scoped>
.friend-ranking {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.ranking-header {
  margin-bottom: 20px;
}

.ranking-header h2 {
  margin: 0 0 16px 0;
  font-size: 24px;
  color: #333;
}

.ranking-tabs {
  display: flex;
  gap: 12px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 12px;
}

.tab-button {
  padding: 8px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  border-radius: 6px;
  transition: all 0.3s;
}

.tab-button:hover {
  background: #f5f5f5;
}

.tab-button.active {
  background: #4CAF50;
  color: white;
}

.loading,
.empty {
  text-align: center;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s;
}

.ranking-item:hover {
  background: #f0f0f0;
  transform: translateX(4px);
}

.ranking-item.current-user {
  background: #e8f5e9;
  border: 2px solid #4CAF50;
}

.rank {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #666;
  background: #e0e0e0;
  border-radius: 50%;
  margin-right: 12px;
}

.rank.rank-1 {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: white;
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.rank.rank-2 {
  background: linear-gradient(135deg, #C0C0C0, #A0A0A0);
  color: white;
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
}

.rank.rank-3 {
  background: linear-gradient(135deg, #CD7F32, #A0522D);
  color: white;
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
}

.user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.user-info h4 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

.current-user-label {
  margin: 0;
  font-size: 12px;
  color: #4CAF50;
}

.score {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.score-value {
  font-size: 20px;
  font-weight: bold;
  color: #4CAF50;
}

.score-label {
  font-size: 12px;
  color: #999;
}
</style>
