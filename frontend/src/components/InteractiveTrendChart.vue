<template>
  <div class="interactive-chart-container">
    <!-- 图表控制栏 -->
    <div class="chart-controls">
      <div class="period-selector">
        <button
          v-for="period in periods"
          :key="period.value"
          class="period-btn"
          :class="{ active: selectedPeriod === period.value }"
          @click="selectedPeriod = period.value">
          {{ period.label }}
        </button>
      </div>
      <div class="chart-actions">
        <button class="action-btn" @click="toggleFilter" title="数据筛选">
          <span class="btn-icon">🔍</span>
        </button>
        <button class="action-btn" @click="resetChart" title="重置图表">
          <span class="btn-icon">🔄</span>
        </button>
        <button class="action-btn" @click="exportChart" title="导出图表">
          <span class="btn-icon">📥</span>
        </button>
      </div>
    </div>

    <!-- 数据筛选面板 -->
    <div class="filter-panel" v-if="showFilterPanel">
      <div class="filter-header">
        <h4 class="filter-title">数据筛选</h4>
        <button class="close-btn" @click="showFilterPanel = false">×</button>
      </div>
      <div class="filter-options">
        <label class="filter-option" v-for="(option, key) in filterOptions" :key="key">
          <input type="checkbox" v-model="option.selected" @change="updateFilteredData">
          <span class="filter-label">{{ option.label }}</span>
          <div class="filter-color" :style="{ backgroundColor: option.color }"></div>
        </label>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="chart-wrapper" ref="chartWrapper">
      <div v-if="!hasData" class="chart-placeholder">
        <div class="placeholder-icon">📈</div>
        <div class="placeholder-text">暂无数据</div>
      </div>

      <div v-else class="chart-area">
        <div class="chart-summary">
          <span>质量趋势</span>
          <strong>{{ latestOverallScore.toFixed(1) }} 分</strong>
        </div>
        <svg class="chart-svg" viewBox="0 0 100 70" preserveAspectRatio="xMidYMid meet" role="img" aria-label="学习质量趋势">
          <defs>
            <linearGradient v-for="option in activeFilterOptions" :id="`${option.key}Gradient`" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" :stop-color="option.color" stop-opacity="0.4"/>
              <stop offset="100%" :stop-color="option.color" stop-opacity="0.05"/>
            </linearGradient>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
            </filter>
          </defs>

          <g class="grid-lines">
            <line v-for="line in gridLines" :key="`grid-${line}`"
                  :x1="6" :y1="line"
                  :x2="94" :y2="line"
                  stroke="#e0e0e0" stroke-width="0.1"/>
          </g>

          <g v-for="option in activeFilterOptions" :key="option.key">
            <path
              :d="getAreaPath(option.key)"
              :fill="`url(#${option.key}Gradient)`"
              class="trend-area"
            />
            <path
              :d="getSmoothPath(option.key)"
              fill="none"
              :stroke="option.color"
              stroke-width="1.4"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="trend-line"
              filter="url(#shadow)"
              @click="showDetail(option.key, $event)"
            />
          </g>

          <g v-for="(point, index) in filteredData" :key="`point-${index}`">
            <g v-for="option in activeFilterOptions" :key="option.key">
              <circle
                :cx="point.x"
                :cy="(point as any)[option.key]"
                r="2.6"
                :fill="option.color"
                fill-opacity="0.2"
                class="data-point-glow"
              />
              <!-- 主点 -->
              <circle
                :cx="point.x"
                :cy="(point as any)[option.key]"
                r="1.8"
                :fill="option.color"
                stroke="white"
                stroke-width="0.8"
                class="data-point"
                @click.stop="showPointDetail(option.key, index, $event)"
              />
            </g>
          </g>
        </svg>

        <!-- 图例 -->
        <div class="chart-legend">
          <div v-for="option in filterOptions" :key="option.key" 
               class="legend-item" 
               :class="{ active: option.selected }"
               @click="toggleFilterOption(option.key)">
            <div class="legend-color" :style="{ backgroundColor: option.color }"></div>
            <div class="legend-label">{{ option.label }}</div>
          </div>
        </div>

        <!-- X轴标签 -->
        <div class="x-axis-labels">
          <div v-for="(label, index) in xLabels" :key="index" 
               class="axis-label"
               :style="{ left: `${label.x}%` }">
            {{ label.text }}
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showDetailModal" class="detail-modal" :style="detailModalStyle">
      <div class="detail-header">
        <h4 class="detail-title">{{ detailData.title }}</h4>
        <button class="close-btn" @click="showDetailModal = false">×</button>
      </div>
      <div class="detail-content">
        <div class="detail-item" v-for="(value, key) in detailData.values" :key="key">
          <span class="detail-label">{{ getDimensionName(key) }}:</span>
          <span class="detail-value">{{ value }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

// Props
interface Props {
  data: Array<{
    date: string;
    overallScore: number;
    memoryScore: number;
    understandingScore: number;
    applicationScore: number;
  }>;
}

const props = withDefaults(defineProps<Props>(), {
  data: () => []
});

// 状态
const selectedPeriod = ref(7);
const showFilterPanel = ref(false);
const showDetailModal = ref(false);
const detailData = ref({
  title: '',
  values: {} as Record<string, any>
});
const detailModalStyle = ref({
  left: '0px',
  top: '0px'
});

const periods = [
  { label: '7天', value: 7 },
  { label: '30天', value: 30 }
];

const filterOptions = ref([
  { key: 'overallScore', label: '综合得分', color: '#2f7d5c', selected: true },
  { key: 'memoryScore', label: '记忆', color: '#4277b8', selected: true },
  { key: 'understandingScore', label: '理解', color: '#f3b23d', selected: true },
  { key: 'applicationScore', label: '应用', color: '#c66f4b', selected: true }
]);

const gridLines = [14, 26, 38, 50, 62];

// 计算属性
const hasData = computed(() => props.data && props.data.length > 0);

const activeFilterOptions = computed(() => 
  filterOptions.value.filter(option => option.selected)
);

const filteredData = computed(() => {
  if (!hasData.value || props.data.length === 0) return [];

  const maxIndex = props.data.length - 1;
  return props.data.map((d, i) => ({
    ...d,
    x: maxIndex === 0 ? 50 : 7 + (i / maxIndex) * 86,
    overallScore: 54 - ((d.overallScore || 0) / 100) * 44,
    memoryScore: 54 - ((d.memoryScore || 0) / 100) * 44,
    understandingScore: 54 - ((d.understandingScore || 0) / 100) * 44,
    applicationScore: 54 - ((d.applicationScore || 0) / 100) * 44
  }));
});

const latestOverallScore = computed(() => {
  if (!props.data.length) return 0;
  return props.data[props.data.length - 1].overallScore || 0;
});

const xLabels = computed(() => {
  if (!hasData.value || props.data.length === 0) return [];

  const step = Math.ceil(props.data.length / 10); // 最多显示10个标签
  const maxIndex = props.data.length - 1;
  return props.data
    .map((d, i) => ({
      x: maxIndex === 0 ? 50 : 7 + (i / maxIndex) * 86,
      text: new Date(d.date).getDate() + '日'
    }))
    .filter((_, i) => i % step === 0);
});

// 方法
// 生成平滑曲线路径(使用贝塞尔曲线)
const getSmoothPath = (key: string): string => {
  if (!filteredData.value || filteredData.value.length === 0) return '';

  const points = filteredData.value.map(d => ({ x: d.x, y: (d as any)[key] }));

  if (points.length < 2) return '';

  // 只有两个点时直接返回直线
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  // 使用Catmull-Rom样条曲线生成平滑曲线
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // 计算控制点
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return path;
};

// 生成平滑区域填充路径
const getAreaPath = (key: string): string => {
  if (!filteredData.value || filteredData.value.length === 0) return '';

  const points = filteredData.value.map(d => ({ x: d.x, y: (d as any)[key] }));

  if (points.length < 2) return '';

  // 只有两个点时直接返回直线区域
  if (points.length === 2) {
    const first = points[0];
    const last = points[1];
    return `M ${first.x} ${first.y} L ${last.x} ${last.y} L ${last.x} 64 L ${first.x} 64 Z`;
  }

  // 使用Catmull-Rom样条曲线生成平滑曲线
  let path = `M ${points[0].x} ${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    // 计算控制点
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  // 添加底部点以形成封闭区域
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];
  path += ` L ${lastPoint.x} 64 L ${firstPoint.x} 64 Z`;

  return path;
};

const getDimensionName = (key: string): string => {
  const names: Record<string, string> = {
    overallScore: '综合得分',
    memoryScore: '记忆',
    understandingScore: '理解',
    applicationScore: '应用'
  };
  return names[key] || key;
};

const toggleFilterOption = (key: string): void => {
  const option = filterOptions.value.find(o => o.key === key);
  if (option) {
    option.selected = !option.selected;
  }
};

const updateFilteredData = (): void => {
  // 数据会自动通过computed属性更新
};

const showDetail = (key: string, event: MouseEvent): void => {
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  detailData.value = {
    title: getDimensionName(key) + '趋势详情',
    values: {
      '平均分': calculateAverage(key),
      '最高分': calculateMax(key),
      '最低分': calculateMin(key)
    }
  };
  detailModalStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top}px`
  };
  showDetailModal.value = true;
};

const showPointDetail = (key: string, index: number, event: MouseEvent): void => {
  const data = props.data[index];
  const rect = (event.target as HTMLElement).getBoundingClientRect();
  const dimensionName = getDimensionName(key);
  detailData.value = {
    title: `${new Date(data.date).toLocaleDateString()} - ${dimensionName}`,
    values: {
      '综合得分': data.overallScore.toFixed(1),
      '记忆': data.memoryScore.toFixed(1),
      '理解': data.understandingScore.toFixed(1),
      '应用': data.applicationScore.toFixed(1)
    }
  };
  detailModalStyle.value = {
    left: `${rect.left + rect.width / 2}px`,
    top: `${rect.top}px`
  };
  showDetailModal.value = true;
};

const calculateAverage = (key: string): number => {
  return props.data.reduce((sum, d) => sum + (d as any)[key], 0) / props.data.length;
};

const calculateMax = (key: string): number => {
  return Math.max(...props.data.map(d => (d as any)[key]));
};

const calculateMin = (key: string): number => {
  return Math.min(...props.data.map(d => (d as any)[key]));
};

// 切换筛选面板
const toggleFilter = (): void => {
  showFilterPanel.value = !showFilterPanel.value;
};

// 重置图表
const resetChart = (): void => {
  filterOptions.value.forEach(option => option.selected = true);
};

// 导出图表
const exportChart = (): void => {
  const svg = document.querySelector('.chart-svg') as SVGElement;
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  canvas.width = 1000;
  canvas.height = 600;

  img.onload = () => {
    ctx?.drawImage(img, 0, 0, 1000, 600);

    // 添加标题
    ctx!.font = '24px Arial';
    ctx!.fillStyle = '#333';
    ctx!.textAlign = 'center';
    ctx!.fillText('学习质量趋势图', 500, 30);

    // 导出图片
    const link = document.createElement('a');
    link.download = `学习质量趋势_${new Date().toLocaleDateString()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
};

// 监听周期变化
watch(selectedPeriod, () => {
  // 这里可以触发父组件更新数据
});
</script>

<style scoped>
.interactive-chart-container {
  position: relative;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 16px;
}

/* 控制栏 */
.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.period-selector {
  display: flex;
  gap: 8px;
}

.period-btn {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.period-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-color: transparent;
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.btn-icon {
  font-size: 1.2rem;
}

/* 筛选面板 */
.filter-panel {
  position: absolute;
  top: 60px;
  right: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  z-index: 100;
  min-width: 200px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
}

.close-btn:hover {
  color: #333;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.filter-label {
  flex: 1;
  font-size: 0.95rem;
}

.filter-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* 图表区域 */
.chart-wrapper {
  position: relative;
  height: auto;
  min-height: 240px;
  overflow: hidden;
  border-radius: 18px;
}

.chart-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}

.placeholder-icon {
  font-size: 4rem;
  margin-bottom: 12px;
}

.placeholder-text {
  font-size: 1.1rem;
}

.chart-area {
  position: relative;
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto minmax(140px, 1fr) auto auto;
  gap: 6px;
  min-height: 240px;
  cursor: default;
  overflow: hidden;
  padding: 10px 12px;
}

.chart-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  color: #65736f;
  font-weight: 700;
}

.chart-summary strong {
  color: #20312d;
  font-size: 1.12rem;
  font-weight: 900;
}

.chart-svg {
  width: 100%;
  height: 100%;
  min-height: 140px;
  display: block;
  overflow: hidden;
}

.grid-lines line {
  stroke: rgba(32, 49, 45, 0.1);
  stroke-width: 0.35;
}

.trend-line {
  cursor: pointer;
  transition: all 0.3s ease;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.trend-line:hover {
  stroke-width: 2;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.trend-area {
  transition: opacity 0.3s ease;
}

.trend-area:hover {
  opacity: 0.8;
}

.data-point-glow {
  transition: r 0.3s ease, fill-opacity 0.3s ease;
}

.data-point {
  cursor: pointer;
  transition: all 0.3s ease;
}

.data-point:hover {
  r: 2.4;
  stroke-width: 1;
}

.data-point-glow:hover {
  r: 3.4;
  fill-opacity: 0.3;
}

/* 图例 */
.chart-legend {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 0;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.82rem;
  color: #666;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.legend-item.active {
  opacity: 1;
}

.legend-item:hover {
  opacity: 0.8;
}

/* X轴标签 */
.x-axis-labels {
  position: relative;
  left: auto;
  right: auto;
  height: 18px;
}

.axis-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.74rem;
  color: #999;
}

/* 详情弹窗 */
.detail-modal {
  position: fixed;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 16px;
  min-width: 250px;
  z-index: 1000;
  transform: translate(-50%, -100%);
  margin-top: -10px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e0e0e0;
}

.detail-title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.95rem;
}

.detail-label {
  color: #666;
}

.detail-value {
  font-weight: 600;
  color: #333;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    gap: 12px;
  }

  .chart-wrapper {
    min-height: 240px;
  }

  .chart-legend {
    flex-wrap: wrap;
  }
}
</style>
