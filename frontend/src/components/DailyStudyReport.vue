<template>
  <div class="daily-report-container">
    <!-- 头部区域 -->
    <div class="report-header">
      <div class="header-content">
        <h2 class="report-title">每日学习报告</h2>
        <div class="date-selector">
          <button class="date-btn" @click="changeDate(-1)">
            <span class="btn-icon">◀</span>
          </button>
          <div class="current-date">{{ formatDate(selectedDate) }}</div>
          <button class="date-btn" @click="changeDate(1)" :disabled="isToday">
            <span class="btn-icon">▶</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 学习总览卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon">⏱️</div>
        <div class="card-content">
          <div class="card-value">{{ formatTime(reportData.totalStudyTime) }}</div>
          <div class="card-label">学习时长</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">📚</div>
        <div class="card-content">
          <div class="card-value">{{ reportData.wordsLearned.newWords + reportData.wordsLearned.reviewWords }}</div>
          <div class="card-label">学习单词</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">📊</div>
        <div class="card-content">
          <div class="card-value">{{ reportData.practiceStats.spellingAccuracy }}%</div>
          <div class="card-label">正确率</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">🔥</div>
        <div class="card-content">
          <div class="card-value">{{ reportData.achievements.continuousDays }}</div>
          <div class="card-label">连续天数</div>
        </div>
      </div>
    </div>

    <!-- 学习效率卡片 -->
    <div class="overview-cards">
      <div class="overview-card">
        <div class="card-icon">⚡</div>
        <div class="card-content">
          <div class="card-value">{{ reportData.efficiency.wordsPerMinute.toFixed(2) }}</div>
          <div class="card-label">单词/分钟</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">🎯</div>
        <div class="card-content">
          <div class="card-value">{{ (reportData.efficiency.masteryRate * 100).toFixed(1) }}%</div>
          <div class="card-label">掌握率</div>
        </div>
      </div>
      <div class="overview-card">
        <div class="card-icon">📈</div>
        <div class="card-content">
          <div class="card-value">{{ reportData.efficiency.masterySpeed.toFixed(3) }}</div>
          <div class="card-label">掌握速度</div>
        </div>
      </div>
    </div>

    <!-- 历史对比 -->
    <div class="comparison-section" v-if="hasEfficiencyData">
      <div class="section-header">
        <h3 class="section-title">历史对比</h3>
      </div>
      <div class="comparison-cards">
        <div class="comparison-card">
          <div class="comparison-title">上周</div>
          <div class="comparison-item">
            <span class="comparison-label">单词/分钟</span>
            <span class="comparison-value">{{ historicalComparison.lastWeek.wordsPerMinute.toFixed(2) }}</span>
            <span :class="getComparisonClass(reportData.efficiency.wordsPerMinute, historicalComparison.lastWeek.wordsPerMinute)">
              {{ getComparisonArrow(reportData.efficiency.wordsPerMinute, historicalComparison.lastWeek.wordsPerMinute) }}
            </span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label">掌握率</span>
            <span class="comparison-value">{{ (historicalComparison.lastWeek.masteryRate * 100).toFixed(1) }}%</span>
            <span :class="getComparisonClass(reportData.efficiency.masteryRate, historicalComparison.lastWeek.masteryRate)">
              {{ getComparisonArrow(reportData.efficiency.masteryRate, historicalComparison.lastWeek.masteryRate) }}
            </span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label">掌握速度</span>
            <span class="comparison-value">{{ historicalComparison.lastWeek.masterySpeed.toFixed(3) }}</span>
            <span :class="getComparisonClass(reportData.efficiency.masterySpeed, historicalComparison.lastWeek.masterySpeed)">
              {{ getComparisonArrow(reportData.efficiency.masterySpeed, historicalComparison.lastWeek.masterySpeed) }}
            </span>
          </div>
        </div>
        <div class="comparison-card">
          <div class="comparison-title">上月</div>
          <div class="comparison-item">
            <span class="comparison-label">单词/分钟</span>
            <span class="comparison-value">{{ historicalComparison.lastMonth.wordsPerMinute.toFixed(2) }}</span>
            <span :class="getComparisonClass(reportData.efficiency.wordsPerMinute, historicalComparison.lastMonth.wordsPerMinute)">
              {{ getComparisonArrow(reportData.efficiency.wordsPerMinute, historicalComparison.lastMonth.wordsPerMinute) }}
            </span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label">掌握率</span>
            <span class="comparison-value">{{ (historicalComparison.lastMonth.masteryRate * 100).toFixed(1) }}%</span>
            <span :class="getComparisonClass(reportData.efficiency.masteryRate, historicalComparison.lastMonth.masteryRate)">
              {{ getComparisonArrow(reportData.efficiency.masteryRate, historicalComparison.lastMonth.masteryRate) }}
            </span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label">掌握速度</span>
            <span class="comparison-value">{{ historicalComparison.lastMonth.masterySpeed.toFixed(3) }}</span>
            <span :class="getComparisonClass(reportData.efficiency.masterySpeed, historicalComparison.lastMonth.masterySpeed)">
              {{ getComparisonArrow(reportData.efficiency.masterySpeed, historicalComparison.lastMonth.masterySpeed) }}
            </span>
          </div>
        </div>
        <div class="comparison-card">
          <div class="comparison-title">历史平均</div>
          <div class="comparison-item">
            <span class="comparison-label">单词/分钟</span>
            <span class="comparison-value">{{ historicalComparison.allTime.wordsPerMinute.toFixed(2) }}</span>
            <span :class="getComparisonClass(reportData.efficiency.wordsPerMinute, historicalComparison.allTime.wordsPerMinute)">
              {{ getComparisonArrow(reportData.efficiency.wordsPerMinute, historicalComparison.allTime.wordsPerMinute) }}
            </span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label">掌握率</span>
            <span class="comparison-value">{{ (historicalComparison.allTime.masteryRate * 100).toFixed(1) }}%</span>
            <span :class="getComparisonClass(reportData.efficiency.masteryRate, historicalComparison.allTime.masteryRate)">
              {{ getComparisonArrow(reportData.efficiency.masteryRate, historicalComparison.allTime.masteryRate) }}
            </span>
          </div>
          <div class="comparison-item">
            <span class="comparison-label">掌握速度</span>
            <span class="comparison-value">{{ historicalComparison.allTime.masterySpeed.toFixed(3) }}</span>
            <span :class="getComparisonClass(reportData.efficiency.masterySpeed, historicalComparison.allTime.masterySpeed)">
              {{ getComparisonArrow(reportData.efficiency.masterySpeed, historicalComparison.allTime.masterySpeed) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习时长分布 -->
    <div class="chart-section">
      <div class="section-header">
        <h3 class="section-title">学习时长分布</h3>
      </div>
      <div class="chart-container">
        <div class="chart-placeholder" v-if="!hasChartData">
          <div class="placeholder-icon">📊</div>
          <div class="placeholder-text">暂无数据</div>
        </div>
        <div v-else class="donut-chart">
          <div class="donut-segment" 
               v-for="(segment, index) in chartSegments" 
               :key="index"
               :style="segment.style">
          </div>
          <div class="donut-center">
            <div class="center-value">{{ formatTime(reportData.totalStudyTime) }}</div>
            <div class="center-label">总时长</div>
          </div>
        </div>
      </div>
      <div class="chart-legend" v-if="hasChartData">
        <div class="legend-item" v-for="(item, index) in legendItems" :key="index">
          <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
          <div class="legend-label">{{ item.label }}</div>
          <div class="legend-value">{{ formatTime(item.value) }}</div>
        </div>
      </div>
    </div>

    <!-- 学习进度趋势 -->
    <div class="chart-section">
      <div class="section-header">
        <h3 class="section-title">学习进度趋势</h3>
        <div class="trend-selector">
          <button 
            class="trend-btn" 
            :class="{ active: trendPeriod === 7 }"
            @click="trendPeriod = 7">
            7天
          </button>
          <button 
            class="trend-btn" 
            :class="{ active: trendPeriod === 30 }"
            @click="trendPeriod = 30">
            30天
          </button>
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-placeholder" v-if="!hasTrendData">
          <div class="placeholder-icon">📈</div>
          <div class="placeholder-text">暂无数据</div>
        </div>
        <div v-else class="line-chart">
          <svg class="chart-svg" viewBox="0 0 100 60" preserveAspectRatio="none">
            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" :stop-color="chartColors.primary" stop-opacity="0.6"/>
                <stop offset="100%" :stop-color="chartColors.primary" stop-opacity="1"/>
              </linearGradient>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="chartColors.primary" stop-opacity="0.3"/>
                <stop offset="100%" :stop-color="chartColors.primary" stop-opacity="0"/>
              </linearGradient>
              <filter id="shadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" :flood-color="chartColors.primary" flood-opacity="0.3"/>
              </filter>
            </defs>
            <!-- 填充区域 -->
            <polygon
              :points="areaPoints"
              fill="url(#areaGradient)"
            />
            <!-- 折线 -->
            <polyline
              :points="trendLinePoints"
              fill="none"
              stroke="url(#lineGradient)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              filter="url(#shadow)"
            />
            <!-- 数据点 -->
            <circle
              v-for="(point, index) in trendPoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="3"
              :fill="chartColors.primary"
              stroke="white"
              stroke-width="1.5"
              class="data-point"
            />
            <!-- 数据标签 -->
            <g
              v-for="(point, index) in trendPoints"
              :key="`label-${index}`"
              class="data-label"
              :transform="`translate(${point.x}, ${point.y - 8})`"
            >
              <rect
                x="-20"
                y="-12"
                width="40"
                height="16"
                rx="4"
                fill="white"
                :stroke="chartColors.primary"
                stroke-width="1"
                class="label-bg"
              />
              <text
                x="0"
                y="0"
                text-anchor="middle"
                dominant-baseline="middle"
                :fill="chartColors.primary"
                font-size="6"
                font-weight="600"
                class="label-text"
              >
                {{ trendData[index].studyTime }}分钟
              </text>
            </g>
          </svg>
          <div class="chart-labels">
            <div 
              class="chart-label" 
              v-for="(label, index) in trendLabels" 
              :key="index"
              :style="{ left: label.x + '%' }">
              {{ label.text }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习效率趋势 -->
    <div class="chart-section">
      <div class="section-header">
        <h3 class="section-title">学习效率趋势</h3>
        <div class="trend-selector">
          <button
            class="trend-btn"
            :class="{ active: trendPeriod === 7 }"
            @click="trendPeriod = 7">
            7天
          </button>
          <button
            class="trend-btn"
            :class="{ active: trendPeriod === 30 }"
            @click="trendPeriod = 30">
            30天
          </button>
        </div>
      </div>
      <div class="chart-container">
        <div class="chart-placeholder" v-if="!hasEfficiencyTrendData">
          <div class="placeholder-icon">📊</div>
          <div class="placeholder-text">暂无数据</div>
        </div>
        <div v-else class="line-chart">
          <svg class="chart-svg" viewBox="0 0 100 60" preserveAspectRatio="none">
            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="efficiencyLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" :stop-color="chartColors.secondary" stop-opacity="0.6"/>
                <stop offset="100%" :stop-color="chartColors.secondary" stop-opacity="1"/>
              </linearGradient>
              <linearGradient id="efficiencyAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" :stop-color="chartColors.secondary" stop-opacity="0.3"/>
                <stop offset="100%" :stop-color="chartColors.secondary" stop-opacity="0"/>
              </linearGradient>
              <filter id="efficiencyShadow">
                <feDropShadow dx="0" dy="2" stdDeviation="2" :flood-color="chartColors.secondary" flood-opacity="0.3"/>
              </filter>
            </defs>
            <!-- 填充区域 -->
            <polygon
              :points="efficiencyAreaPoints"
              fill="url(#efficiencyAreaGradient)"
            />
            <!-- 折线 -->
            <polyline
              :points="efficiencyTrendLinePoints"
              fill="none"
              stroke="url(#efficiencyLineGradient)"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              filter="url(#efficiencyShadow)"
            />
            <!-- 数据点 -->
            <circle
              v-for="(point, index) in efficiencyTrendPoints"
              :key="index"
              :cx="point.x"
              :cy="point.y"
              r="3"
              :fill="chartColors.secondary"
              stroke="white"
              stroke-width="1.5"
              class="data-point"
            />
            <!-- 数据标签 -->
            <g
              v-for="(point, index) in efficiencyTrendPoints"
              :key="`efficiency-label-${index}`"
              class="data-label"
              :transform="`translate(${point.x}, ${point.y - 8})`"
            >
              <rect
                x="-20"
                y="-12"
                width="40"
                height="16"
                rx="4"
                fill="white"
                :stroke="chartColors.secondary"
                stroke-width="1"
                class="label-bg"
              />
              <text
                x="0"
                y="0"
                text-anchor="middle"
                dominant-baseline="middle"
                :fill="chartColors.secondary"
                font-size="6"
                font-weight="600"
                class="label-text"
              >
                {{ efficiencyTrendData[index].wordsPerMinute.toFixed(2) }}
              </text>
            </g>
          </svg>
          <div class="chart-labels">
            <div
              class="chart-label"
              v-for="(label, index) in efficiencyTrendLabels"
              :key="index"
              :style="{ left: label.x + '%' }">
              {{ label.text }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 学习建议 -->
    <div class="suggestions-section" v-if="suggestions.length > 0">
      <div class="section-header">
        <h3 class="section-title">学习建议</h3>
      </div>
      <div class="suggestions-list">
        <div 
          class="suggestion-card" 
          v-for="(suggestion, index) in suggestions" 
          :key="index">
          <div class="suggestion-icon">{{ suggestion.icon }}</div>
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
          </div>
          <button class="suggestion-btn" @click="handleSuggestionAction(suggestion)">
            开始练习
          </button>
        </div>
      </div>
    </div>

    <!-- 成就展示 -->
    <div class="achievements-section">
      <div class="section-header">
        <h3 class="section-title">成就展示</h3>
        <button class="view-all-btn" @click="viewAllAchievements">
          查看全部
        </button>
      </div>
      <div class="achievements-grid">
        <div 
          class="achievement-card" 
          v-for="(achievement, index) in displayAchievements" 
          :key="index"
          :class="{ unlocked: achievement.unlocked }"
          @click="showAchievementDetail(achievement)">
          <div class="achievement-icon">{{ achievement.icon }}</div>
          <div class="achievement-name">{{ achievement.name }}</div>
          <div class="achievement-status" v-if="achievement.unlocked">
            {{ formatDate(achievement.unlockedDate) }}解锁
          </div>
          <div class="achievement-status" v-else>
            {{ achievement.progress ? `${achievement.progress.current}/${achievement.progress.target}` : '未解锁' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import StudyQualityAssessment from './StudyQualityAssessment.vue';

// 数据类型定义
interface DailyStudyReport {
  date: string;
  totalStudyTime: number;
  moduleStudyTime: {
    vocabulary: number;
    listening: number;
    spelling: number;
    aiPractice: number;
  };
  wordsLearned: {
    newWords: number;
    reviewWords: number;
  };
  practiceStats: {
    spellingAccuracy: number;
    listeningCompletion: number;
    aiPracticeCount: number;
  };
  achievements: {
    continuousDays: number;
    totalDays: number;
    unlockedAchievements: string[];
  };
  efficiency: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
}

interface EfficiencyTrend {
  date: string;
  studyTime: number;
  wordsCount: number;
  wordsPerMinute: number;
  masteryRate: number;
  masterySpeed: number;
}

interface HistoricalComparison {
  lastWeek: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
  lastMonth: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
  allTime: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  progress?: {
    current: number;
    target: number;
  };
}

interface Suggestion {
  id: string;
  type: string;
  icon: string;
  title: string;
  description: string;
  actionUrl: string;
}

// 状态
const selectedDate = ref(new Date());
const reportData = ref<DailyStudyReport>({
  date: new Date().toISOString().split('T')[0],
  totalStudyTime: 0,
  moduleStudyTime: {
    vocabulary: 0,
    listening: 0,
    spelling: 0,
    aiPractice: 0,
  },
  wordsLearned: {
    newWords: 0,
    reviewWords: 0,
  },
  practiceStats: {
    spellingAccuracy: 0,
    listeningCompletion: 0,
    aiPracticeCount: 0,
  },
  achievements: {
    continuousDays: 0,
    totalDays: 0,
    unlockedAchievements: [],
  },
  efficiency: {
    wordsPerMinute: 0,
    masteryRate: 0,
    masterySpeed: 0,
  },
});

const trendPeriod = ref(7);
const trendData = ref<Array<{ date: string; studyTime: number; wordsCount: number }>>([]);
const efficiencyTrendData = ref<EfficiencyTrend[]>([]);
const historicalComparison = ref<HistoricalComparison>({
  lastWeek: {
    wordsPerMinute: 0,
    masteryRate: 0,
    masterySpeed: 0,
  },
  lastMonth: {
    wordsPerMinute: 0,
    masteryRate: 0,
    masterySpeed: 0,
  },
  allTime: {
    wordsPerMinute: 0,
    masteryRate: 0,
    masterySpeed: 0,
  },
});
const achievements = ref<Achievement[]>([]);
const suggestions = ref<Suggestion[]>([]);

// 颜色配置
const chartColors = {
  primary: '#667eea',
  secondary: '#764ba2',
  vocabulary: '#4CAF50',
  listening: '#2196F3',
  spelling: '#FF9800',
  aiPractice: '#9C27B0',
};

// 计算属性
const isToday = computed(() => {
  const today = new Date();
  return selectedDate.value.toDateString() === today.toDateString();
});

const hasChartData = computed(() => {
  return reportData.value.totalStudyTime > 0;
});

const hasTrendData = computed(() => {
  return trendData.value.length > 0;
});

const hasEfficiencyData = computed(() => {
  return reportData.value.efficiency.wordsPerMinute > 0;
});

const hasEfficiencyTrendData = computed(() => {
  return efficiencyTrendData.value.length > 0;
});

const chartSegments = computed(() => {
  const segments = [];
  let startAngle = 0;
  const colors = [
    chartColors.vocabulary,
    chartColors.listening,
    chartColors.spelling,
    chartColors.aiPractice,
  ];

  const moduleTimes = [
    reportData.value.moduleStudyTime.vocabulary,
    reportData.value.moduleStudyTime.listening,
    reportData.value.moduleStudyTime.spelling,
    reportData.value.moduleStudyTime.aiPractice,
  ];

  const totalTime = reportData.value.totalStudyTime;

  moduleTimes.forEach((time, index) => {
    if (time > 0) {
      const percentage = (time / totalTime) * 100;
      const angle = (percentage / 100) * 360;
      const endAngle = startAngle + angle;

      segments.push({
        style: {
          background: `conic-gradient(${colors[index]} ${startAngle}deg ${endAngle}deg)`,
        },
      });

      startAngle = endAngle;
    }
  });

  return segments;
});

const legendItems = computed(() => {
  const items = [
    { label: '词汇', value: reportData.value.moduleStudyTime.vocabulary, color: chartColors.vocabulary },
    { label: '听力', value: reportData.value.moduleStudyTime.listening, color: chartColors.listening },
    { label: '拼写', value: reportData.value.moduleStudyTime.spelling, color: chartColors.spelling },
    { label: 'AI练习', value: reportData.value.moduleStudyTime.aiPractice, color: chartColors.aiPractice },
  ];

  return items.filter(item => item.value > 0);
});

const displayAchievements = computed(() => {
  return achievements.value.slice(0, 6);
});

const trendPoints = computed(() => {
  if (trendData.value.length === 0) return [];

  const maxTime = Math.max(...trendData.value.map(d => d.studyTime), 1);

  return trendData.value.map((d, i) => ({
    x: (i / (trendData.value.length - 1)) * 100,
    y: 60 - (d.studyTime / maxTime) * 50,
  }));
});

const trendLinePoints = computed(() => {
  return trendPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const areaPoints = computed(() => {
  if (trendPoints.value.length === 0) return '';
  const points = trendPoints.value.map(p => `${p.x},${p.y}`);
  // 添加底部点以形成封闭区域
  return `${points[0]} ${points.join(' ')} ${trendPoints.value[trendPoints.value.length - 1].x},60 ${trendPoints.value[0].x},60`;
});

const trendLabels = computed(() => {
  return trendData.value.map((d, i) => ({
    x: (i / (trendData.value.length - 1)) * 100,
    text: new Date(d.date).getDate() + '日',
  }));
});

const efficiencyTrendPoints = computed(() => {
  if (efficiencyTrendData.value.length === 0) return [];

  const maxEfficiency = Math.max(...efficiencyTrendData.value.map(d => d.wordsPerMinute), 1);

  return efficiencyTrendData.value.map((d, i) => ({
    x: (i / (efficiencyTrendData.value.length - 1)) * 100,
    y: 60 - (d.wordsPerMinute / maxEfficiency) * 50,
  }));
});

const efficiencyTrendLinePoints = computed(() => {
  return efficiencyTrendPoints.value.map(p => `${p.x},${p.y}`).join(' ');
});

const efficiencyAreaPoints = computed(() => {
  if (efficiencyTrendPoints.value.length === 0) return '';
  const points = efficiencyTrendPoints.value.map(p => `${p.x},${p.y}`);
  // 添加底部点以形成封闭区域
  return `${points[0]} ${points.join(' ')} ${efficiencyTrendPoints.value[efficiencyTrendPoints.value.length - 1].x},60 ${efficiencyTrendPoints.value[0].x},60`;
});

const efficiencyTrendLabels = computed(() => {
  return efficiencyTrendData.value.map((d, i) => ({
    x: (i / (efficiencyTrendData.value.length - 1)) * 100,
    text: new Date(d.date).getDate() + '日',
  }));
});

// 方法
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}年${month}月${day}日`;
};

const formatTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

const changeDate = (days: number): void => {
  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() + days);
  selectedDate.value = newDate;
  loadDailyReport();
};

const loadDailyReport = async (): Promise<void> => {
  try {
    // 这里应该调用实际的API
    // const response = await api.getDailyStudyReport(formatDate(selectedDate.value));
    // reportData.value = response.data;

    // 模拟数据
    reportData.value = {
      date: formatDate(selectedDate.value),
      totalStudyTime: 45,
      moduleStudyTime: {
        vocabulary: 20,
        listening: 10,
        spelling: 10,
        aiPractice: 5,
      },
      wordsLearned: {
        newWords: 20,
        reviewWords: 10,
      },
      practiceStats: {
        spellingAccuracy: 85,
        listeningCompletion: 90,
        aiPracticeCount: 5,
      },
      achievements: {
        continuousDays: 7,
        totalDays: 30,
        unlockedAchievements: ['first_week', 'word_master'],
      },
      efficiency: {
        wordsPerMinute: 0.67,
        masteryRate: 0.75,
        masterySpeed: 0.0167,
      },
    };
  } catch (error) {
    console.error('加载每日报告失败:', error);
  }
};

const loadTrendData = async (): Promise<void> => {
  try {
    // 这里应该调用实际的API
    // const response = await api.getStudyProgressTrend(startDate, endDate);
    // trendData.value = response.data;

    // 模拟数据
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - trendPeriod.value + 1);

    trendData.value = Array.from({ length: trendPeriod.value }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      return {
        date: date.toISOString().split('T')[0],
        studyTime: Math.floor(Math.random() * 60) + 20,
        wordsCount: Math.floor(Math.random() * 30) + 10,
      };
    });

    // 同时加载效率趋势数据
    await loadEfficiencyTrendData();
  } catch (error) {
    console.error('加载趋势数据失败:', error);
  }
};

const loadEfficiencyTrendData = async (): Promise<void> => {
  try {
    // 这里应该调用实际的API
    // const response = await api.getEfficiencyTrend(startDate, endDate);
    // efficiencyTrendData.value = response.data;

    // 模拟数据
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - trendPeriod.value + 1);

    efficiencyTrendData.value = Array.from({ length: trendPeriod.value }, (_, i) => {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const studyTime = Math.floor(Math.random() * 60) + 20;
      const wordsCount = Math.floor(Math.random() * 30) + 10;
      const masteryRate = Math.random() * 0.3 + 0.6; // 0.6-0.9之间

      return {
        date: date.toISOString().split('T')[0],
        studyTime: studyTime,
        wordsCount: wordsCount,
        wordsPerMinute: parseFloat((wordsCount / studyTime).toFixed(2)),
        masteryRate: masteryRate,
        masterySpeed: parseFloat((masteryRate / (studyTime / 60)).toFixed(3)),
      };
    });
  } catch (error) {
    console.error('加载效率趋势数据失败:', error);
  }
};

const loadHistoricalComparison = async (): Promise<void> => {
  try {
    // 这里应该调用实际的API
    // const response = await api.getHistoricalComparison();
    // historicalComparison.value = response.data;

    // 模拟数据
    historicalComparison.value = {
      lastWeek: {
        wordsPerMinute: 0.58,
        masteryRate: 0.68,
        masterySpeed: 0.014,
      },
      lastMonth: {
        wordsPerMinute: 0.52,
        masteryRate: 0.62,
        masterySpeed: 0.012,
      },
      allTime: {
        wordsPerMinute: 0.55,
        masteryRate: 0.65,
        masterySpeed: 0.013,
      },
    };
  } catch (error) {
    console.error('加载历史对比数据失败:', error);
  }
};

const getComparisonClass = (current: number, historical: number): string => {
  if (current > historical) return 'comparison-up';
  if (current < historical) return 'comparison-down';
  return 'comparison-same';
};

const getComparisonArrow = (current: number, historical: number): string => {
  if (current > historical) return '↑';
  if (current < historical) return '↓';
  return '→';
};

const loadAchievements = async (): Promise<void> => {
  try {
    // 这里应该调用实际的API
    // const response = await api.getAchievements();
    // achievements.value = response.data;

    // 模拟数据
    achievements.value = [
      {
        id: 'first_week',
        name: '初学者',
        description: '连续学习7天',
        icon: '🌱',
        unlocked: true,
        unlockedDate: new Date().toISOString().split('T')[0],
      },
      {
        id: 'word_master',
        name: '单词达人',
        description: '累计学习1000个单词',
        icon: '📚',
        unlocked: true,
        unlockedDate: new Date().toISOString().split('T')[0],
      },
      {
        id: 'perfect_spelling',
        name: '拼写大师',
        description: '拼写练习正确率达到95%',
        icon: '✏️',
        unlocked: false,
        progress: {
          current: 85,
          target: 95,
        },
      },
      {
        id: 'listening_expert',
        name: '听力专家',
        description: '听力练习完成度达到100%',
        icon: '🎧',
        unlocked: false,
        progress: {
          current: 90,
          target: 100,
        },
      },
      {
        id: 'ai_friend',
        name: 'AI伙伴',
        description: '完成50次AI对话练习',
        icon: '🤖',
        unlocked: false,
        progress: {
          current: 30,
          target: 50,
        },
      },
      {
        id: 'streak_master',
        name: '连续学习达人',
        description: '连续学习30天',
        icon: '🔥',
        unlocked: false,
        progress: {
          current: 7,
          target: 30,
        },
      },
    ];
  } catch (error) {
    console.error('加载成就数据失败:', error);
  }
};

const loadSuggestions = async (): Promise<void> => {
  try {
    // 这里应该调用实际的API
    // const response = await api.getSuggestions();
    // suggestions.value = response.data;

    // 模拟数据
    suggestions.value = [
      {
        id: 'spelling_practice',
        type: 'spelling',
        icon: '✏️',
        title: '加强拼写练习',
        description: '您的拼写正确率为85%，建议多加练习以提高准确率',
        actionUrl: '/spelling',
      },
      {
        id: 'vocabulary_review',
        type: 'vocabulary',
        icon: '📚',
        title: '复习已学单词',
        description: '您有10个单词需要复习，建议今天完成复习',
        actionUrl: '/review',
      },
    ];
  } catch (error) {
    console.error('加载学习建议失败:', error);
  }
};

const handleSuggestionAction = (suggestion: Suggestion): void => {
  console.log('执行建议操作:', suggestion);
  // 这里可以添加导航到对应练习页面的逻辑
};

const viewAllAchievements = (): void => {
  console.log('查看全部成就');
  // 这里可以添加导航到成就详情页面的逻辑
};

const showAchievementDetail = (achievement: Achievement): void => {
  console.log('显示成就详情:', achievement);
  // 这里可以添加显示成就详情模态框的逻辑
};

// 监听日期变化
watch(selectedDate, () => {
  loadDailyReport();
});

// 监听趋势周期变化
watch(trendPeriod, () => {
  loadTrendData();
});

// 组件挂载时加载数据
onMounted(() => {
  loadDailyReport();
  loadTrendData();
  loadHistoricalComparison();
  loadAchievements();
  loadSuggestions();
});
</script>

<style scoped>
@import '../assets/css/dailyStudyReport.css';
</style>
