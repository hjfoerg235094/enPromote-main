<template>
  <div class="review-plan-container">
    <div class="plan-header">
      <h2 class="title">复习计划</h2>
      <div class="chapter-selector" v-if="chapters && chapters.length > 1">
        <select v-model="selectedChapter" @change="loadReviewData">
          <option v-for="chapter in chapters" :key="chapter" :value="chapter">
            {{ chapter }}章
          </option>
        </select>
      </div>
    </div>

    <!-- 复习统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-icon">📚</div>
        <div class="stat-info">
          <div class="stat-number">{{ reviewStats.totalWords }}</div>
          <div class="stat-label">总单词数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-number">{{ reviewStats.todayReviewCount }}</div>
          <div class="stat-label">今日待复习</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📈</div>
        <div class="stat-info">
          <div class="stat-number">{{ reviewStats.weekReviewCount }}</div>
          <div class="stat-label">本周待复习</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div class="stat-info">
          <div class="stat-number">{{ reviewStats.avgReviewsPerWord }}</div>
          <div class="stat-label">平均复习次数</div>
        </div>
      </div>
    </div>

    <!-- 单词掌握状态分布 -->
    <div class="mastery-chart">
      <h3 class="section-title">单词掌握状态</h3>
      <div class="chart-container">
        <div class="chart-item">
          <div class="color-indicator unknown"></div>
          <span class="label">不认识</span>
          <span class="count">{{ reviewStats.statusCounts.unknown }}</span>
        </div>
        <div class="chart-item">
          <div class="color-indicator vague"></div>
          <span class="label">模糊</span>
          <span class="count">{{ reviewStats.statusCounts.vague }}</span>
        </div>
        <div class="chart-item">
          <div class="color-indicator know"></div>
          <span class="label">认识</span>
          <span class="count">{{ reviewStats.statusCounts.know }}</span>
        </div>
        <div class="chart-item">
          <div class="color-indicator mastered"></div>
          <span class="label">已掌握</span>
          <span class="count">{{ reviewStats.statusCounts.mastered }}</span>
        </div>
      </div>
    </div>

    <!-- 复习计划日历 -->
    <div class="review-calendar">
      <h3 class="section-title">复习计划</h3>
      <div class="calendar-container">
        <div class="calendar-header">
          <button class="nav-button" @click="previousWeek" :disabled="weekOffset <= 0">
            ←
          </button>
          <div class="week-info">
            {{ weekRangeText }}
          </div>
          <button class="nav-button" @click="nextWeek">
            →
          </button>
        </div>
        <div class="calendar-grid">
          <div 
            v-for="(day, index) in currentWeekSchedule" 
            :key="index"
            class="calendar-day"
            :class="{
              'today': isToday(day.date),
              'has-words': day.count > 0,
              'past': isPast(day.date)
            }"
          >
            <div class="day-number">{{ getDayNumber(day.date) }}</div>
            <div class="day-label">{{ getDayLabel(day.date) }}</div>
            <div class="word-count" v-if="day.count > 0">{{ day.count }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 开始复习按钮 -->
    <div class="action-section">
      <button 
        class="start-review-button" 
        @click="startReview"
        :disabled="reviewStats.todayReviewCount === 0"
      >
        <span class="button-icon">📖</span>
        <span class="button-text">开始今日复习</span>
        <span class="button-count" v-if="reviewStats.todayReviewCount > 0">
          ({{ reviewStats.todayReviewCount }}个单词)
        </span>
      </button>
      <div class="no-words-message" v-if="reviewStats.todayReviewCount === 0">
        今日没有需要复习的单词，明天再来吧！
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getReviewSchedule, getReviewStats } from '@/api/reviewPlan';
import { getUserInfo } from '@/api/auth';

const router = useRouter();

// 响应式数据
const selectedChapter = ref('A');
const reviewStats = ref({
  totalWords: 0,
  statusCounts: {
    unknown: 0,
    vague: 0,
    know: 0,
    mastered: 0
  },
  todayReviewCount: 0,
  weekReviewCount: 0,
  avgReviewsPerWord: 0,
  totalReviews: 0
});

const reviewSchedule = ref([]);
const weekOffset = ref(0); // 0表示本周，1表示下周，-1表示上周

// 用户信息
const chapters = ref(['A', 'B']);

// 计算属性：当前周的复习计划
const currentWeekSchedule = computed(() => {
  if (!reviewSchedule.value || reviewSchedule.value.length === 0) {
    return [];
  }

  const startIndex = weekOffset.value * 7;
  return reviewSchedule.value.slice(startIndex, startIndex + 7);
});

// 计算属性：周范围文本
const weekRangeText = computed(() => {
  if (currentWeekSchedule.value.length === 0) {
    return '';
  }

  const startDate = new Date(currentWeekSchedule.value[0].date);
  const endDate = new Date(currentWeekSchedule.value[currentWeekSchedule.value.length - 1].date);

  const formatDate = (date) => {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
});

// 页面加载时获取数据
onMounted(async () => {
  try {
    // 获取用户信息，包括可用章节
    const userRes = await getUserInfo();
    if (userRes.data && userRes.data.chapters) {
      chapters.value = Object.keys(userRes.data.chapters);
      selectedChapter.value = userRes.data.currentChapter || 'A';
    }

    // 加载复习数据
    await loadReviewData();
  } catch (error) {
    console.error('加载复习计划失败:', error);
  }
});

// 加载复习数据
const loadReviewData = async () => {
  try {
    // 获取复习统计数据
    const statsRes = await getReviewStats({ chapter: selectedChapter.value });
    if (statsRes.data && statsRes.data.code === 200) {
      reviewStats.value = statsRes.data.data;
    }

    // 获取复习计划（未来4周）
    const scheduleRes = await getReviewSchedule({ 
      chapter: selectedChapter.value, 
      days: 28 
    });
    if (scheduleRes.data && scheduleRes.data.code === 200) {
      reviewSchedule.value = scheduleRes.data.data.schedule;
    }
  } catch (error) {
    console.error('加载复习数据失败:', error);
  }
};

// 判断是否为今天
const isToday = (dateString) => {
  const today = new Date();
  const date = new Date(dateString);
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// 判断是否为过去的日期
const isPast = (dateString) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateString);
  date.setHours(0, 0, 0, 0);
  return date < today;
};

// 获取日期的数字
const getDayNumber = (dateString) => {
  const date = new Date(dateString);
  return date.getDate();
};

// 获取日期的标签（周一、周二等）
const getDayLabel = (dateString) => {
  const date = new Date(dateString);
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[date.getDay()];
};

// 导航到上一周
const previousWeek = () => {
  if (weekOffset.value > 0) {
    weekOffset.value--;
  }
};

// 导航到下一周
const nextWeek = () => {
  weekOffset.value++;
};

// 开始复习
const startReview = () => {
  router.push({
    path: '/vocabulary-legacy',
    query: { mode: 'review', chapter: selectedChapter.value }
  });
};
</script>

<style scoped>
.review-plan-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
}

.chapter-selector {
  select {
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid #ddd;
    font-size: 16px;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 12px;
}

.stat-icon {
  font-size: 24px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.mastery-chart {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 16px 0;
}

.chart-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.chart-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.color-indicator.unknown {
  background-color: #ff4d4f;
}

.color-indicator.vague {
  background-color: #faad14;
}

.color-indicator.know {
  background-color: #52c41a;
}

.color-indicator.mastered {
  background-color: #1890ff;
}

.review-calendar {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 24px;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.nav-button {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.nav-button:hover:not(:disabled) {
  background-color: #f0f0f0;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.week-info {
  font-weight: bold;
  font-size: 16px;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 12px;
}

.calendar-day {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 12px 8px;
  text-align: center;
  min-height: 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.calendar-day.today {
  border-color: #1890ff;
  background-color: rgba(24, 144, 255, 0.05);
}

.calendar-day.has-words {
  border-color: #52c41a;
  background-color: rgba(82, 196, 26, 0.05);
}

.calendar-day.past {
  opacity: 0.7;
}

.day-number {
  font-weight: bold;
  font-size: 16px;
}

.day-label {
  font-size: 12px;
  color: #666;
  margin-top: 4px;
}

.word-count {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #1890ff;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
}

.action-section {
  text-align: center;
}

.start-review-button {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  border-radius: 12px;
  padding: 16px 24px;
  color: white;
  font-weight: bold;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.start-review-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4);
}

.start-review-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.button-icon {
  font-size: 20px;
}

.no-words-message {
  margin-top: 16px;
  color: #666;
  font-style: italic;
}

@media (max-width: 768px) {
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .calendar-grid {
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
  }

  .calendar-day {
    min-height: 60px;
    padding: 8px 4px;
  }

  .day-number {
    font-size: 14px;
  }

  .day-label {
    font-size: 10px;
  }

  .word-count {
    width: 16px;
    height: 16px;
    font-size: 10px;
  }
}
</style>
