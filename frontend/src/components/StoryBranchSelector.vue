
<template>
  <div class="branch-selector">
    <h3>剧情选择</h3>
    <p class="description">你的选择将影响剧情走向，请谨慎决定：</p>

    <div class="choices-container">
      <div
        v-for="choice in choices"
        :key="choice.choiceId"
        class="choice-card"
        :class="{ selected: selectedChoiceId === choice.choiceId }"
        @click="selectChoice(choice)"
      >
        <div class="choice-header">
          <span class="choice-icon">{{ getChoiceIcon(choice.style) }}</span>
          <h4>{{ choice.choiceText }}</h4>
        </div>
        <p class="choice-impact">{{ choice.impact }}</p>
        <div class="choice-meta">
          <span v-if="choice.style" class="style-tag">{{ getStyleLabel(choice.style) }}</span>
        </div>
      </div>
    </div>

    <div class="action-buttons">
      <button
        class="btn-confirm"
        :disabled="!selectedChoiceId"
        @click="confirmChoice"
      >
        确认选择
      </button>
      <button class="btn-cancel" @click="cancel">
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const props = defineProps<{
  choices: Array<{
    choiceId: string;
    choiceText: string;
    impact: string;
    style?: string;
  }>;
}>();

const emit = defineEmits(['select', 'cancel']);

const selectedChoiceId = ref<string | null>(null);

function getChoiceIcon(style?: string) {
  switch (style) {
    case 'aggressive':
      return '⚔️';
    case 'careful':
      return '🛡️';
    case 'balanced':
      return '⚖️';
    default:
      return '❓';
  }
}

function getStyleLabel(style: string) {
  const labels: Record<string, string> = {
    aggressive: '激进',
    careful: '谨慎',
    balanced: '平衡'
  };
  return labels[style] || style;
}

function selectChoice(choice: any) {
  selectedChoiceId.value = choice.choiceId;
}

function confirmChoice() {
  if (!selectedChoiceId.value) return;

  const selectedChoice = props.choices.find(c => c.choiceId === selectedChoiceId.value);
  if (selectedChoice) {
    emit('select', selectedChoice);
  }
}

function cancel() {
  selectedChoiceId.value = null;
  emit('cancel');
}
</script>

<style scoped>
.branch-selector {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.branch-selector h3 {
  margin: 0 0 12px 0;
  color: #333;
  font-size: 20px;
}

.description {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.6;
}

.choices-container {
  display: grid;
  gap: 16px;
  margin-bottom: 24px;
}

.choice-card {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.choice-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
}

.choice-card.selected {
  border-color: #409eff;
  background: #f0f7ff;
}

.choice-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.choice-icon {
  font-size: 24px;
}

.choice-card h4 {
  margin: 0;
  color: #333;
  font-size: 16px;
  flex: 1;
}

.choice-impact {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
}

.choice-meta {
  display: flex;
  gap: 8px;
}

.style-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.style-tag.aggressive {
  background: #fef0f0;
  color: #f56c6c;
}

.style-tag.careful {
  background: #f0f9ff;
  color: #409eff;
}

.style-tag.balanced {
  background: #f4f4f5;
  color: #909399;
}

.action-buttons {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.action-buttons button {
  padding: 8px 20px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s ease;
}

.btn-confirm {
  background: #409eff;
  border: none;
  color: white;
}

.btn-confirm:hover:not(:disabled) {
  background: #66b1ff;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-cancel {
  background: #f5f5f5;
  border: none;
  color: #666;
}

.btn-cancel:hover {
  background: #e0e0e0;
}
</style>
