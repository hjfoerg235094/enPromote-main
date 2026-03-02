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
        <button class="action-btn" @click="toggleFilterPanel" title="数据筛选">
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
      <div class="zoom-controls" v-if="isZoomed">
        <button class="zoom-btn" @click="zoomIn" title="放大">+</button>
        <button class="zoom-btn" @click="zoomOut" title="缩小">-</button>
        <button class="zoom-btn" @click="resetZoom" title="重置缩放">⟲</button>
      </div>

      <div v-if="!hasData" class="chart-placeholder">
        <div class="placeholder-icon">📈</div>
        <div class="placeholder-text">暂无数据</div>
      </div>

      <div v-else class="chart-area" @wheel.prevent="handleWheel" @mousedown="startDrag" @mouseup="endDrag" @mouseleave="endDrag" @mousemove="handleDrag">
        <svg class="chart-svg" :viewBox="viewBox" preserveAspectRatio="none">
          <!-- 渐变定义 -->
          <defs>
            <linearGradient v-for="option in activeFilterOptions" :id="`${option.key}Gradient`" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" :stop-color="option.color" stop-opacity="0.3"/>
              <stop offset="100%" :stop-color="option.color" stop-opacity="0"/>
            </linearGradient>
          </defs>

          <!-- 网格线 -->
          <g class="grid-lines">
            <line v-for="i in 5" :key="`grid-${i}`" 
                  :x1="0" :y1="i * 12" 
                  :x2="100" :y2="i * 12" 
                  stroke="#e0e0e0" stroke-width="0.1"/>
          </g>

          <!-- 趋势线和区域 -->
          <g v-for="option in activeFilterOptions" :key="option.key">
            <polygon
              :points="getAreaPoints(option.key)"
              :fill="`url(#${option.key}Gradient)`"
            />
            <polyline
              :points="getLinePoints(option.key)"
              fill="none"
              :stroke="option.color"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="trend-line"
              @click="showDetail(option.key, $event)"
            />
          </g>

          <!-- 数据点 -->
          <g v-for="(point, index) in filteredData" :key="`point-${index}`">
            <circle
              v-for="option in activeFilterOptions"
              :key="option.key"
              :cx="point.x"
              :cy="point[option.key]"
              r="3"
              :fill="option.color"
              stroke="white"
              stroke-width="1.5"
              class="data-point"
              @click.stop="showPointDetail(option.key, index, $event)"
            />
          </g>
        </svg>

        <!-- 图例 -->
        <div class="chart-legend">
          <div v-for="option in filterOptions" :key="option.key" 
               class="legend-item" 
               :class="{ active: option.selected }"
               @click="toggleFilter(option.key)">
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
  { key: 'overallScore', label: '综合得分', color: '#667eea', selected: true },
  { key: 'memoryScore', label: '记忆', color: '#4CAF50', selected: true },
  { key: 'understandingScore', label: '理解', color: '#2196F3', selected: true },
  { key: 'applicationScore', label: '应用', color: '#FF9800', selected: true }
]);

// 缩放和平移状态
const zoomLevel = ref(1);
const panOffset = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

// 计算属性
const hasData = computed(() => props.data && props.data.length > 0);

const activeFilterOptions = computed(() => 
  filterOptions.value.filter(option => option.selected)
);

const filteredData = computed(() => {
  if (!hasData.value) return [];

  const data = props.data.map((d, i) => ({
    ...d,
    x: (i / (props.data.length - 1)) * 100,
    overallScore: 60 - (d.overallScore / 100) * 50,
    memoryScore: 60 - (d.memoryScore / 100) * 50,
    understandingScore: 60 - (d.understandingScore / 100) * 50,
    applicationScore: 60 - (d.applicationScore / 100) * 50
  }));

  // 应用缩放和平移
  return data.map(d => ({
    ...d,
    x: (d.x + panOffset.value.x) * zoomLevel.value,
    overallScore: d.overallScore * zoomLevel.value + panOffset.value.y,
    memoryScore: d.memoryScore * zoomLevel.value + panOffset.value.y,
    understandingScore: d.understandingScore * zoomLevel.value + panOffset.value.y,
    applicationScore: d.applicationScore * zoomLevel.value + panOffset.value.y
  }));
});

const isZoomed = computed(() => zoomLevel.value !== 1 || 
  panOffset.value.x !== 0 || panOffset.value.y !== 0);

const viewBox = computed(() => {
  const width = 100 * zoomLevel.value;
  const height = 60 * zoomLevel.value;
  return `${panOffset.value.x} ${panOffset.value.y} ${width} ${height}`;
});

const xLabels = computed(() => {
  if (!hasData.value) return [];

  const step = Math.ceil(props.data.length / 10); // 最多显示10个标签
  return props.data
    .map((d, i) => ({
      x: (i / (props.data.length - 1)) * 100,
      text: new Date(d.date).getDate() + '日'
    }))
    .filter((_, i) => i % step === 0);
});

// 方法
const getLinePoints = (key: string): string => {
  return filteredData.value
    .map(d => `${d.x},${d[key]}`)
    .join(' ');
};

const getAreaPoints = (key: string): string => {
  if (filteredData.value.length === 0) return '';
  const points = filteredData.value.map(d => `${d.x},${d[key]}`);
  // 添加底部点以形成封闭区域
  return `${points[0]} ${points.join(' ')} ${filteredData.value[filteredData.value.length - 1].x},60 ${filteredData.value[0].x},60`;
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

const toggleFilter = (key: string): void => {
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
  detailData.value = {
    title: `${new Date(data.date).toLocaleDateString()} 详情`,
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
  return props.data.reduce((sum, d) => sum + d[key], 0) / props.data.length;
};

const calculateMax = (key: string): number => {
  return Math.max(...props.data.map(d => d[key]));
};

const calculateMin = (key: string): number => {
  return Math.min(...props.data.map(d => d[key]));
};

// 缩放功能
const handleWheel = (event: WheelEvent): void => {
  event.preventDefault();
  const delta = event.deltaY > 0 ? 0.9 : 1.1;
  const newZoom = Math.min(Math.max(zoomLevel.value * delta, 0.5), 3);
  zoomLevel.value = newZoom;
};

const zoomIn = (): void => {
  zoomLevel.value = Math.min(zoomLevel.value * 1.2, 3);
};

const zoomOut = (): void => {
  zoomLevel.value = Math.max(zoomLevel.value * 0.8, 0.5);
};

const resetZoom = (): void => {
  zoomLevel.value = 1;
  panOffset.value = { x: 0, y: 0 };
};

// 平移功能
const startDrag = (event: MouseEvent): void => {
  isDragging.value = true;
  dragStart.value = { x: event.clientX, y: event.clientY };
};

const handleDrag = (event: MouseEvent): void => {
  if (!isDragging.value) return;

  const deltaX = (event.clientX - dragStart.value.x) / 10;
  const deltaY = (event.clientY - dragStart.value.y) / 10;

  panOffset.value = {
    x: panOffset.value.x + deltaX,
    y: panOffset.value.y + deltaY
  };

  dragStart.value = { x: event.clientX, y: event.clientY };
};

const endDrag = (): void => {
  isDragging.value = false;
};

// 重置图表
const resetChart = (): void => {
  resetZoom();
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
  padding: 20px;
}

/* 控制栏 */
.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
  height: 400px;
}

.zoom-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.zoom-btn:hover {
  background: #f5f5f5;
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
  height: 100%;
  cursor: grab;
}

.chart-area:active {
  cursor: grabbing;
}

.chart-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}

.trend-line {
  cursor: pointer;
  transition: stroke-width 0.2s;
}

.trend-line:hover {
  stroke-width: 3;
}

.data-point {
  cursor: pointer;
  transition: r 0.2s;
}

.data-point:hover {
  r: 5;
}

/* 图例 */
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
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 24px;
}

.axis-label {
  position: absolute;
  transform: translateX(-50%);
  font-size: 0.85rem;
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
    height: 300px;
  }

  .chart-legend {
    flex-wrap: wrap;
  }
}
</style>
