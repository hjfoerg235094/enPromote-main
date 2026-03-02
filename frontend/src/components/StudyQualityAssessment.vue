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
    // 这里应该调用实际的API
    // const response = await getStudyQualityAssessment(undefined, trendPeriod.value);
    // qualityData.value = response.data.data;

    // 模拟数据
    const today = new Date().toISOString().split('T')[0];
    qualityData.value = {
      overallScore: 78,
      dimensions: {
        memory: {
          score: 82,
          level: '良好',
          description: '您的单词记忆能力较好，能够较快掌握新单词',
          metrics: {
            accuracy: 85,
            retention: 79
          }
        },
        understanding: {
          score: 75,
          level: '良好',
          description: '您对单词的理解能力良好，但在语境应用方面还需加强',
          metrics: {
            comprehension: 75
          }
        },
        application: {
          score: 72,
          level: '一般',
          description: '您在单词应用方面还有提升空间，建议多进行实际应用练习',
          metrics: {
            usage: 68
          }
        }
      },
      trend: Array.from({ length: trendPeriod.value }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (trendPeriod.value - 1 - i));
        return {
          date: date.toISOString().split('T')[0],
          overallScore: 70 + Math.random() * 15,
          memoryScore: 75 + Math.random() * 15,
          understandingScore: 70 + Math.random() * 15,
          applicationScore: 65 + Math.random() * 15
        };
      }),
      suggestions: [
        {
          id: 'suggestion_1',
          type: 'application',
          icon: '📝',
          title: '加强单词应用练习',
          description: '建议通过造句、对话等方式加强单词的实际应用',
          priority: '高',
          actionUrl: '/ai-chat'
        },
        {
          id: 'suggestion_2',
          type: 'understanding',
          icon: '📖',
          title: '提升语境理解能力',
          description: '建议多阅读英文文章，提高在语境中理解单词的能力',
          priority: '中',
          actionUrl: '/reading'
        },
        {
          id: 'suggestion_3',
          type: 'memory',
          icon: '🔄',
          title: '定期复习已学单词',
          description: '建议使用间隔重复法复习，提高长期记忆效果',
          priority: '高',
          actionUrl: '/review'
        }
      ]
    };
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
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 12px;
}

/* 质量得分卡片 */
.quality-score-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.score-circle {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.score-value {
  font-size: 3rem;
  font-weight: 700;
  color: white;
}

.score-label {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 4px;
}

.score-level {
  font-size: 1.5rem;
  font-weight: 600;
  padding: 8px 24px;
  border-radius: 20px;
}

.level-excellent {
  background-color: #e8f5e9;
  color: #4CAF50;
}

.level-good {
  background-color: #e3f2fd;
  color: #2196F3;
}

.level-average {
  background-color: #fff3e0;
  color: #FF9800;
}

.level-poor {
  background-color: #ffebee;
  color: #F44336;
}

/* 质量维度分析 */
.quality-dimensions-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.dimension-card {
  display: flex;
  gap: 16px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.dimension-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dimension-icon {
  font-size: 2.5rem;
  flex-shrink: 0;
}

.dimension-content {
  flex: 1;
}

.dimension-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.dimension-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333;
}

.dimension-score {
  font-size: 1.5rem;
  font-weight: 700;
  color: #667eea;
}

.dimension-level {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.dimension-description {
  font-size: 0.95rem;
  color: #666;
  margin-bottom: 12px;
  line-height: 1.5;
}

.dimension-metrics {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: #666;
}

.metric-label {
  color: #999;
}

.metric-value {
  font-weight: 600;
  color: #333;
}

/* 质量变化趋势 */
.quality-trend-section {
  margin-bottom: 24px;
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

/* 质量改进建议 */
.quality-suggestions-section {
  margin-bottom: 24px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
  border-left: 4px solid transparent;
}

.suggestion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  font-size: 2rem;
  flex-shrink: 0;
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
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
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
  font-size: 0.95rem;
  color: #666;
  line-height: 1.5;
}

.suggestion-btn {
  padding: 8px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.suggestion-btn:hover {
  opacity: 0.9;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dimensions-grid {
    grid-template-columns: 1fr;
  }

  .suggestion-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .suggestion-btn {
    width: 100%;
    margin-top: 12px;
  }
}
</style>
