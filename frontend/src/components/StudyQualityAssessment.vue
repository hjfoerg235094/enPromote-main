<template>
  <div class="quality-assessment-container">
    <section class="quality-summary-card">
      <div class="quality-score-compact">
        <strong>{{ qualityData.overallScore }}</strong>
        <span>质量分</span>
      </div>
      <div class="quality-summary-copy">
        <span class="quality-kicker">学习质量诊断</span>
        <h3>{{ getScoreLevelText(qualityData.overallScore) }}</h3>
        <p>{{ qualitySummaryText }}</p>
      </div>
      <div class="score-level" :class="getScoreLevelClass(qualityData.overallScore)">
        {{ getScoreLevelText(qualityData.overallScore) }}
      </div>
    </section>

    <section class="quality-dimensions-section">
      <div class="dimensions-grid">
        <div class="dimension-card" v-for="(dimension, key) in qualityData.dimensions" :key="key">
          <span class="dimension-icon">{{ getDimensionIcon(key) }}</span>
          <div class="dimension-header">
            <span class="dimension-name">{{ getDimensionName(key) }}</span>
            <strong>{{ dimension.score }}分</strong>
          </div>
          <div class="dimension-level" :class="getScoreLevelClass(dimension.score)">
            {{ dimension.level }}
          </div>
          <p>{{ dimension.description }}</p>
        </div>
      </div>
    </section>

    <section class="quality-trend-section">
      <InteractiveTrendChart :data="qualityData.trend" />
    </section>

    <section class="quality-suggestions-section" v-if="displaySuggestions.length > 0">
      <div class="section-header">
        <h3 class="section-title">质量改进建议</h3>
      </div>
      <div class="suggestions-list">
        <div
          class="suggestion-card"
          v-for="(suggestion, index) in displaySuggestions"
          :key="index"
          :class="`priority-${suggestion.priority.toLowerCase()}`">
          <div class="suggestion-icon">{{ suggestion.icon }}</div>
          <div class="suggestion-content">
            <div class="suggestion-header">
              <span class="suggestion-title">{{ suggestion.title }}</span>
              <span class="suggestion-priority" :class="`priority-${suggestion.priority.toLowerCase()}`">
                {{ suggestion.priority }}优先级
              </span>
            </div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
          </div>
          <button class="suggestion-btn" @click="handleSuggestionAction(suggestion)">
            开始练习
          </button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { getStudyQualityAssessment } from '@/api/quality';
import type { StudyQualityAssessment } from '@/api/quality';
import InteractiveTrendChart from './InteractiveTrendChart.vue';

// 状态
const trendPeriod = ref(7);
const qualityData = ref<StudyQualityAssessment>({
  overallScore: 0,
  dimensions: {
    memory: {
      score: 0,
      level: '',
      description: '',
      metrics: {
        accuracy: 0,
        retention: 0
      }
    },
    understanding: {
      score: 0,
      level: '',
      description: '',
      metrics: {
        comprehension: 0
      }
    },
    application: {
      score: 0,
      level: '',
      description: '',
      metrics: {
        usage: 0
      }
    }
  },
  trend: [],
  suggestions: []
});


// 颜色配置
const chartColors = {
  overall: '#667eea',
  memory: '#4CAF50',
  understanding: '#2196F3',
  application: '#FF9800',
};

// 计算属性
const hasTrendData = computed(() => {
  return qualityData.value.trend.length > 0;
});

const qualitySummaryText = computed(() => {
  const score = qualityData.value.overallScore;
  if (score >= 80) return '今天的学习质量不错，可以保持当前节奏，并通过实战对话继续巩固。';
  if (score >= 60) return '基础表现稳定，建议补齐分数较低的维度，让训练更均衡。';
  if (score > 0) return '质量分偏低，优先完成词汇、拼写和听力的闭环练习。';
  return '完成一轮学习后，这里会生成更具体的质量诊断。';
});

const displaySuggestions = computed(() => {
  return qualityData.value.suggestions.slice(0, 2);
});

const overallTrendLinePoints = computed(() => {
  if (!qualityData.value.trend || qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - ((d.overallScore || 0) / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const memoryTrendLinePoints = computed(() => {
  if (!qualityData.value.trend || qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - ((d.memoryScore || 0) / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const understandingTrendLinePoints = computed(() => {
  if (!qualityData.value.trend || qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - ((d.understandingScore || 0) / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const applicationTrendLinePoints = computed(() => {
  if (!qualityData.value.trend || qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - ((d.applicationScore || 0) / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const trendLabels = computed(() => {
  return qualityData.value.trend.map((d, i) => ({
    x: (i / (qualityData.value.trend.length - 1)) * 100,
    text: new Date(d.date).getDate() + '日',
  }));
});

// 方法
const getScoreLevelClass = (score: number): string => {
  if (score >= 90) return 'level-excellent';
  if (score >= 80) return 'level-good';
  if (score >= 60) return 'level-average';
  return 'level-poor';
};

const getScoreLevelText = (score: number): string => {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 60) return '一般';
  return '需改进';
};

const getDimensionIcon = (key: string): string => {
  const icons: Record<string, string> = {
    memory: '🧠',
    understanding: '💡',
    application: '🎯'
  };
  return icons[key] || '📊';
};

const getDimensionName = (key: string): string => {
  const names: Record<string, string> = {
    memory: '记忆能力',
    understanding: '理解能力',
    application: '应用能力'
  };
  return names[key] || key;
};

const getMetricName = (key: string): string => {
  const names: Record<string, string> = {
    accuracy: '正确率',
    retention: '记忆保持率',
    comprehension: '理解度',
    usage: '应用能力'
  };
  return names[key] || key;
};

const formatMetricValue = (key: string, value: number | undefined): string => {
  if (value === undefined) return 'N/A';
  if (key === 'accuracy' || key === 'retention' || key === 'comprehension' || key === 'usage') {
    return `${value.toFixed(1)}%`;
  }
  return value.toString();
};


const handleSuggestionAction = (suggestion: any): void => {
  console.log('执行建议操作:', suggestion);
  // 这里可以添加导航到对应练习页面的逻辑
};

const loadQualityAssessment = async (): Promise<void> => {
  try {
    const response = await getStudyQualityAssessment(undefined, trendPeriod.value);

    if (response.data?.code === 200 && response.data.data) {
      qualityData.value = response.data.data;
    } else {
      // 如果没有数据，使用默认值
      qualityData.value = {
        overallScore: 0,
        dimensions: {
          memory: {
            score: 0,
            level: '需改进',
            description: '暂无数据，请先进行学习活动',
            metrics: {
              accuracy: 0,
              retention: 0
            }
          },
          understanding: {
            score: 0,
            level: '需改进',
            description: '暂无数据，请先进行学习活动',
            metrics: {
              comprehension: 0
            }
          },
          application: {
            score: 0,
            level: '需改进',
            description: '暂无数据，请先进行学习活动',
            metrics: {
              usage: 0
            }
          }
        },
        trend: [],
        suggestions: []
      };
    }
  } catch (error) {
    console.error('加载学习质量评估失败:', error);
  }
};

// 监听趋势周期变化
watch(trendPeriod, () => {
  loadQualityAssessment();
});

// 组件挂载时加载数据
onMounted(() => {
  loadQualityAssessment();
});
</script>

<style scoped>
.quality-assessment-container {
  width: min(1180px, calc(100% - 32px));
  margin: 0 auto 36px;
  padding: 0;
  color: var(--learn-ink, #20312d);
}

.quality-summary-card,
.quality-dimensions-section,
.quality-trend-section,
.quality-suggestions-section {
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 34px rgba(47, 67, 62, 0.08);
}

.quality-summary-card {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 18px;
  align-items: center;
  margin-bottom: 14px;
  padding: 20px;
}

.quality-score-compact {
  display: grid;
  place-items: center;
  align-content: center;
  width: 86px;
  height: 86px;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(47, 125, 92, 0.14), rgba(243, 178, 61, 0.18));
}

.quality-score-compact strong {
  color: var(--learn-accent, #2f7d5c);
  font-size: 2rem;
  line-height: 1;
}

.quality-score-compact span {
  color: var(--learn-muted, #65736f);
  font-size: 0.78rem;
  font-weight: 800;
}

.quality-kicker {
  color: var(--learn-accent, #2f7d5c);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.08em;
}

.quality-summary-copy h3 {
  margin: 4px 0 6px;
  font-size: 1.45rem;
}

.quality-summary-copy p {
  margin: 0;
  color: var(--learn-muted, #65736f);
  line-height: 1.5;
}

.score-level {
  width: fit-content;
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 900;
}

.level-excellent {
  background-color: rgba(47, 125, 92, 0.12);
  color: var(--learn-accent, #2f7d5c);
}

.level-good {
  background-color: rgba(66, 119, 184, 0.12);
  color: #4277b8;
}

.level-average {
  background-color: rgba(243, 178, 61, 0.18);
  color: #a86d12;
}

.level-poor {
  background-color: rgba(198, 111, 75, 0.14);
  color: #a9492c;
}

.quality-dimensions-section {
  margin-bottom: 14px;
  padding: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  margin: 0;
  color: var(--learn-ink, #20312d);
  font-size: 1.15rem;
  font-weight: 950;
}

.trend-selector {
  display: flex;
  gap: 8px;
}

.trend-btn {
  padding: 6px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.trend-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.dimensions-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.dimension-card {
  display: grid;
  gap: 8px;
  min-height: 132px;
  padding: 14px;
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
  border-radius: 18px;
  background: var(--learn-surface-soft, #f6f2e8);
}

.dimension-card:hover {
  transform: translateY(-2px);
}

.dimension-icon {
  font-size: 1.45rem;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.dimension-name {
  color: var(--learn-ink, #20312d);
  font-weight: 900;
}

.dimension-header strong {
  color: var(--learn-accent, #2f7d5c);
}

.dimension-level {
  display: inline-flex;
  width: fit-content;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 900;
}

.dimension-card p {
  margin: 0;
  color: var(--learn-muted, #65736f);
  font-size: 0.9rem;
  line-height: 1.5;
}

.quality-trend-section {
  margin-bottom: 14px;
  padding: 14px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 20px;
  position: relative;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #999;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 12px;
}

.placeholder-text {
  font-size: 1.1rem;
}

.line-chart {
  position: relative;
}

.chart-svg {
  width: 100%;
  height: 300px;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.chart-labels {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
}

.chart-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.85rem;
  color: #999;
}

.quality-suggestions-section {
  margin-bottom: 0;
  padding: 16px;
}

.suggestions-list {
  display: grid;
  gap: 12px;
}

.suggestion-card {
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--learn-border, rgba(32, 49, 45, 0.12));
  border-left: 4px solid transparent;
  border-radius: 16px;
  background: rgba(250, 248, 241, 0.72);
}

.suggestion-card:hover {
  transform: translateY(-2px);
}

.suggestion-card.priority-high {
  border-left-color: #F44336;
}

.suggestion-card.priority-medium {
  border-left-color: #FF9800;
}

.suggestion-card.priority-low {
  border-left-color: #4CAF50;
}

.suggestion-icon {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: #fff;
  font-size: 1.25rem;
}

.suggestion-content {
  flex: 1;
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.suggestion-title {
  color: var(--learn-ink, #20312d);
  font-size: 1rem;
  font-weight: 900;
}

.suggestion-priority {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
}

.suggestion-priority.priority-high {
  background-color: #ffebee;
  color: #F44336;
}

.suggestion-priority.priority-medium {
  background-color: #fff3e0;
  color: #FF9800;
}

.suggestion-priority.priority-low {
  background-color: #e8f5e9;
  color: #4CAF50;
}

.suggestion-description {
  color: var(--learn-muted, #65736f);
  font-size: 0.9rem;
  line-height: 1.5;
}

.suggestion-btn {
  min-height: 38px;
  padding: 0 16px;
  background: var(--learn-accent, #2f7d5c);
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 900;
  cursor: pointer;
  transition: opacity 0.2s;
}

.suggestion-btn:hover {
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .quality-assessment-container {
    width: min(100% - 20px, 1180px);
  }

  .quality-summary-card {
    grid-template-columns: 1fr;
  }

  .dimensions-grid {
    grid-template-columns: 1fr;
  }

  .suggestion-card {
    grid-template-columns: 1fr;
  }

  .suggestion-btn {
    width: 100%;
    margin-top: 12px;
  }
}
</style>
