<template>
  <div class="friend-profile-container">
    <div v-if="loading" class="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="error">
      <div class="error-icon">⚠️</div>
      <p>{{ error }}</p>
      <button class="btn-primary" @click="fetchFriendData">重试</button>
    </div>

    <div v-else class="profile-content">
      <!-- 好友基本信息 -->
      <div class="profile-header">
        <div class="avatar-section">
          <img :src="friendAvatar" :alt="friendInfo.username" class="avatar-large" />
          <div class="user-info">
            <h2>{{ friendInfo.remark || friendInfo.username }}</h2>
            <p v-if="friendInfo.remark" class="username">@{{ friendInfo.username }}</p>
            <p class="join-date">加入时间: {{ formatDate(friendInfo.joinDate) }}</p>
          </div>
        </div>
      </div>

      <!-- 学习进度对比 -->
      <div class="comparison-section">
        <h2>学习进度对比</h2>

        <!-- 学习时长对比 -->
        <div class="comparison-card">
          <h3>学习时长（最近30天）</h3>
          <div class="comparison-content">
            <div class="comparison-item">
              <div class="comparison-label">我</div>
              <div class="comparison-value">{{ comparison.studyTime.user.totalHours }} 小时</div>
              <div class="comparison-bar">
                <div class="bar-fill user" :style="{ width: getPercentage(comparison.studyTime.user.totalMinutes, comparison.studyTime.friend.totalMinutes) + '%' }"></div>
              </div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">{{ friendInfo.remark || friendInfo.username }}</div>
              <div class="comparison-value">{{ comparison.studyTime.friend.totalHours }} 小时</div>
              <div class="comparison-bar">
                <div class="bar-fill friend" :style="{ width: getPercentage(comparison.studyTime.friend.totalMinutes, comparison.studyTime.user.totalMinutes) + '%' }"></div>
              </div>
            </div>
            <div class="comparison-diff">
              <span v-if="comparison.studyTime.difference.isAhead" class="diff-positive">
                ⬆️ 你领先 {{ comparison.studyTime.difference.hours }} 小时
              </span>
              <span v-else class="diff-negative">
                ⬇️ 你落后 {{ Math.abs(comparison.studyTime.difference.hours) }} 小时
              </span>
            </div>
          </div>
        </div>

        <!-- 单词掌握量对比 -->
        <div class="comparison-card">
          <h3>单词掌握量</h3>
          <div class="comparison-content">
            <div class="comparison-item">
              <div class="comparison-label">我</div>
              <div class="comparison-value">{{ comparison.wordMastery.user.totalWords }} 个单词</div>
              <div class="comparison-bar">
                <div class="bar-fill user" :style="{ width: getPercentage(comparison.wordMastery.user.totalWords, comparison.wordMastery.friend.totalWords) + '%' }"></div>
              </div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">{{ friendInfo.remark || friendInfo.username }}</div>
              <div class="comparison-value">{{ comparison.wordMastery.friend.totalWords }} 个单词</div>
              <div class="comparison-bar">
                <div class="bar-fill friend" :style="{ width: getPercentage(comparison.wordMastery.friend.totalWords, comparison.wordMastery.user.totalWords) + '%' }"></div>
              </div>
            </div>
            <div class="comparison-diff">
              <span v-if="comparison.wordMastery.difference.isAhead" class="diff-positive">
                ⬆️ 你领先 {{ comparison.wordMastery.difference.words }} 个单词
              </span>
              <span v-else class="diff-negative">
                ⬇️ 你落后 {{ Math.abs(comparison.wordMastery.difference.words) }} 个单词
              </span>
            </div>
          </div>
        </div>

        <!-- 连续学习天数对比 -->
        <div class="comparison-card">
          <h3>连续学习天数</h3>
          <div class="comparison-content">
            <div class="comparison-item">
              <div class="comparison-label">我</div>
              <div class="comparison-value">{{ comparison.streakDays.user }} 天</div>
              <div class="comparison-bar">
                <div class="bar-fill user" :style="{ width: getPercentage(comparison.streakDays.user, comparison.streakDays.friend) + '%' }"></div>
              </div>
            </div>
            <div class="comparison-item">
              <div class="comparison-label">{{ friendInfo.remark || friendInfo.username }}</div>
              <div class="comparison-value">{{ comparison.streakDays.friend }} 天</div>
              <div class="comparison-bar">
                <div class="bar-fill friend" :style="{ width: getPercentage(comparison.streakDays.friend, comparison.streakDays.user) + '%' }"></div>
              </div>
            </div>
            <div class="comparison-diff">
              <span v-if="comparison.streakDays.difference.isAhead" class="diff-positive">
                ⬆️ 你领先 {{ comparison.streakDays.difference.days }} 天
              </span>
              <span v-else class="diff-negative">
                ⬇️ 你落后 {{ Math.abs(comparison.streakDays.difference.days) }} 天
              </span>
            </div>
          </div>
        </div>

        <!-- 剧情进度对比 -->
        <div class="comparison-card">
          <h3>剧情进度</h3>
          <div class="story-comparison">
            <div class="story-item">
              <h4>我的进度</h4>
              <div v-if="comparison.storyProgress.user.stories.length > 0">
                <div v-for="story in comparison.storyProgress.user.stories" :key="story.storyId" class="story-detail">
                  <p>故事 {{ story.storyId }}</p>
                  <p>当前章节: {{ story.currentChapter }}</p>
                  <p>完成章节: {{ story.completedChapters }} 个</p>
                  <p>总分: {{ story.totalScore }}</p>
                </div>
              </div>
              <p v-else class="empty-story">暂无剧情进度</p>
            </div>
            <div class="story-item">
              <h4>{{ friendInfo.remark || friendInfo.username }}的进度</h4>
              <div v-if="comparison.storyProgress.friend.stories.length > 0">
                <div v-for="story in comparison.storyProgress.friend.stories" :key="story.storyId" class="story-detail">
                  <p>故事 {{ story.storyId }}</p>
                  <p>当前章节: {{ story.currentChapter }}</p>
                  <p>完成章节: {{ story.completedChapters }} 个</p>
                  <p>总分: {{ story.totalScore }}</p>
                </div>
              </div>
              <p v-else class="empty-story">暂无剧情进度</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 返回按钮 -->
      <div class="back-button">
        <button class="btn-secondary" @click="goBack">返回</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getFriendCompare } from '@/api/friendCompare'
import { getUserInfo } from '@/api/auth'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref('')
const friendInfo = ref({})
const friendAvatar = ref('/default-avatar.png')
const comparison = ref({
  studyTime: {
    user: { totalMinutes: 0, totalHours: 0 },
    friend: { totalMinutes: 0, totalHours: 0 },
    difference: { minutes: 0, hours: 0, isAhead: false }
  },
  wordMastery: {
    user: { totalWords: 0 },
    friend: { totalWords: 0 },
    difference: { words: 0, isAhead: false }
  },
  streakDays: {
    user: 0,
    friend: 0,
    difference: { days: 0, isAhead: false }
  },
  storyProgress: {
    user: { stories: [] },
    friend: { stories: [] }
  }
})

// 获取好友数据
const fetchFriendData = async () => {
  try {
    loading.value = true
    error.value = ''

    const friendId = route.params.userId

    // 获取好友学习进度对比
    const compareRes = await getFriendCompare(friendId)
    if (compareRes.data.code === 200) {
      comparison.value = compareRes.data.data
    } else {
      error.value = compareRes.data.message || '获取好友进度失败'
      return
    }

    // 获取当前用户信息
    const userRes = await getUserInfo()
    if (userRes.data.code === 200) {
      // 这里可以添加获取好友基本信息的逻辑
      friendInfo.value = {
        username: '好友用户名', // 实际应该从API获取
        joinDate: new Date(),
        remark: ''
      }
    }

  } catch (err) {
    console.error('获取好友数据失败:', err)
    error.value = '获取好友数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 计算百分比
const getPercentage = (value1, value2) => {
  if (!value1 && !value2) return 0
  const total = value1 + value2
  if (total === 0) return 0
  return Math.round((value1 / total) * 100)
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return '未知'
  return new Date(date).toLocaleDateString('zh-CN')
}

// 返回上一页
const goBack = () => {
  router.back()
}

onMounted(() => {
  fetchFriendData()
})
</script>

<style scoped>
.friend-profile-container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

.loading, .error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 20px;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-icon {
  font-size: 48px;
}

.profile-header {
  background: white;
  border-radius: 8px;
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.avatar-large {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #f0f0f0;
}

.user-info h2 {
  margin: 0 0 5px 0;
  color: #333;
  font-size: 24px;
}

.user-info .username {
  margin: 0 0 5px 0;
  color: #999;
  font-size: 14px;
}

.user-info .join-date {
  margin: 0;
  color: #666;
  font-size: 12px;
}

.comparison-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.comparison-section h2 {
  color: #333;
  font-size: 24px;
  margin: 0 0 20px 0;
}

.comparison-card {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.comparison-card h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.comparison-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comparison-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.comparison-label {
  font-weight: 600;
  color: #666;
  font-size: 14px;
}

.comparison-value {
  font-size: 20px;
  color: #333;
  font-weight: 600;
}

.comparison-bar {
  width: 100%;
  height: 24px;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  transition: width 0.5s ease;
  border-radius: 12px;
}

.bar-fill.user {
  background: linear-gradient(90deg, #4CAF50, #45a049);
}

.bar-fill.friend {
  background: linear-gradient(90deg, #2196F3, #1976D2);
}

.comparison-diff {
  padding: 12px;
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
}

.diff-positive {
  background: #e8f5e9;
  color: #4CAF50;
}

.diff-negative {
  background: #ffebee;
  color: #f44336;
}

.story-comparison {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.story-item h4 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 16px;
}

.story-detail {
  padding: 12px;
  background: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 12px;
}

.story-detail p {
  margin: 4px 0;
  color: #666;
  font-size: 14px;
}

.empty-story {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px;
}

.back-button {
  margin-top: 24px;
  text-align: center;
}

.btn-primary, .btn-secondary {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #4CAF50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #f5f5f5;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
