
<template>
  <div class="quality-assessment-container">
    <!-- 质量得分卡片 -->
    <div class="quality-score-card">
      <div class="score-circle">
        <div class="score-value">{{ qualityData.overallScore }}</div>
        <div class="score-label">学习质量得分</div>
      </div>
      <div class="score-level" :class="getScoreLevelClass(qualityData.overallScore)">
        {{ getScoreLevelText(qualityData.overallScore) }}
      </div>
    </div>

    <!-- 质量维度分析 -->
    <div class="quality-dimensions-section">
      <div class="section-header">
        <h3 class="section-title">质量维度分析</h3>
      </div>
      <div class="dimensions-grid">
        <div class="dimension-card" v-for="(dimension, key) in qualityData.dimensions" :key="key">
          <div class="dimension-icon">{{ getDimensionIcon(key) }}</div>
          <div class="dimension-content">
            <div class="dimension-header">
              <span class="dimension-name">{{ getDimensionName(key) }}</span>
              <span class="dimension-score">{{ dimension.score }}分</span>
            </div>
            <div class="dimension-level" :class="getScoreLevelClass(dimension.score)">
              {{ dimension.level }}
            </div>
            <div class="dimension-description">{{ dimension.description }}</div>
            <div class="dimension-metrics">
              <div v-for="(value, metricKey) in dimension.metrics" :key="metricKey" class="metric-item">
                <span class="metric-label">{{ getMetricName(metricKey) }}:</span>
                <span class="metric-value">{{ formatMetricValue(metricKey, value) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 质量变化趋势 -->
    <div class="quality-trend-section">
      <InteractiveTrendChart :data="qualityData.trend" />
    </div>

    <!-- 质量改进建议 -->
    <div class="quality-suggestions-section" v-if="qualityData.suggestions.length > 0">
      <div class="section-header">
        <h3 class="section-title">质量改进建议</h3>
      </div>
      <div class="suggestions-list">
        <div
          class="suggestion-card"
          v-for="(suggestion, index) in qualityData.suggestions"
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
    </div>
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

const overallTrendLinePoints = computed(() => {
  if (qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - (d.overallScore / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const memoryTrendLinePoints = computed(() => {
  if (qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - (d.memoryScore / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const understandingTrendLinePoints = computed(() => {
  if (qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - (d.understandingScore / 100) * 50;
    return `${x},${y}`;
  }).join(' ');
});

const applicationTrendLinePoints = computed(() => {
  if (qualityData.value.trend.length === 0) return '';
  return qualityData.value.trend.map((d, i) => {
    const x = (i / (qualityData.value.trend.length - 1)) * 100;
    const y = 60 - (d.applicationScore / 100) * 50;
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

<style>
/* 保持原有的样式 */
</style>
