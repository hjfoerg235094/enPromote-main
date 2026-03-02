<template>
  <div class="task-executor">
    <!-- 对话任务 -->
    <DialogueTask 
      v-if="task.type === 'dialogue'"
      :task="task"
      :story-id="storyId"
      :chapter-id="chapterId"
      :ai-role="aiRole"
      @complete="handleTaskComplete"
      @cancel="$emit('cancel')"
    />

    <!-- 拼写任务 -->
    <SpellingTask 
      v-else-if="task.type === 'spelling'"
      :task="task"
      :story-id="storyId"
      :chapter-id="chapterId"
      @complete="handleTaskComplete"
      @cancel="$emit('cancel')"
    />

    <!-- 听力任务 -->
    <ListeningTask 
      v-else-if="task.type === 'listening'"
      :task="task"
      :story-id="storyId"
      :chapter-id="chapterId"
      @complete="handleTaskComplete"
      @cancel="$emit('cancel')"
    />

    <!-- 阅读任务 -->
    <ReadingTask 
      v-else-if="task.type === 'reading'"
      :task="task"
      :story-id="storyId"
      :chapter-id="chapterId"
      @complete="handleTaskComplete"
      @cancel="$emit('cancel')"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import DialogueTask from './DialogueTask.vue';
import SpellingTask from './SpellingTask.vue';
import ListeningTask from './ListeningTask.vue';
import ReadingTask from './ReadingTask.vue';

const props = defineProps<{
  task: any;
  storyId?: string;
  chapterId?: number;
  aiRole?: string;
}>();

const emit = defineEmits(['complete', 'cancel']);

async function handleTaskComplete(taskData: any) {
  // 发送任务完成数据到后端进行AI判定
  console.log('TaskExecutor - storyId:', props.storyId);
  console.log('TaskExecutor - chapterId:', props.chapterId);
  console.log('TaskExecutor - taskId:', props.task.id);

  try {
    const response = await fetch(`/api/story/${props.storyId}/chapter/${props.chapterId}/task/${props.task.id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || '任务提交失败');
    }

    if (result.success && result.data) {
      // 任务完成，保存进度到数据库
      try {
        const progressResponse = await fetch(`/api/story/${props.storyId}/chapter/${props.chapterId}/task/${props.task.id}/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            isCompleted: result.data.feedback.score >= 60,
            score: result.data.feedback.score,
            maxScore: result.data.feedback.maxScore || 100,
            taskData: taskData,
            userPerformance: {
              wordsUsed: taskData.wordsUsed || [],
              turns: taskData.turns || 0,
              correctRate: taskData.correctRate || 0,
              correctAnswers: taskData.correctAnswers || 0,
              totalQuestions: taskData.totalQuestions || 0
            },
            feedback: result.data.feedback
          })
        });

        const progressResult = await progressResponse.json();

        if (!progressResponse.ok || !progressResult.success) {
          console.error('保存进度失败:', progressResult.message);
        }
      } catch (progressError) {
        console.error('保存进度时出错:', progressError);
      }

      // 显示AI反馈
      emit('complete', {
        ...taskData,
        feedback: result.data.feedback,
        isCompleted: result.data.feedback.score >= 60
      });
    } else if (result.data && result.data.feedback) {
      // 任务未通过，显示AI反馈
      emit('complete', {
        ...taskData,
        feedback: result.data.feedback,
        isCompleted: false
      });
    } else {
      throw new Error(result.message || '任务提交失败');
    }
  } catch (error) {
    console.error('任务完成失败:', error);
    emit('complete', {
      ...taskData,
      feedback: {
        message: '任务提交失败，请重试',
        improvements: []
      },
      isCompleted: false
    });
  }
}
</script>

<style scoped>
.task-executor {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}
</style>
