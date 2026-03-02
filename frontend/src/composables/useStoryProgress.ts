import { ref, computed } from 'vue';
import {
  getStoryProgress,
  getAllStoryProgress,
  initializeChapter,
  updateTaskProgress,
  getChapterProgress,
  resetStoryProgress
} from '../api/storyProgress';

export function useStoryProgress() {
  const currentProgress = ref<any>(null);
  const allProgresses = ref<any[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性：当前章节
  const currentChapter = computed(() => {
    if (!currentProgress.value) return null;
    return currentProgress.value.chapters?.find(
      (ch: any) => ch.chapterId === currentProgress.value.currentChapterId
    );
  });

  // 计算属性：完成百分比
  const completionPercentage = computed(() => {
    if (!currentProgress.value) return 0;
    const totalChapters = currentProgress.value.chapters?.length || 1;
    const completedChapters = currentProgress.value.chapters?.filter((ch: any) => ch.isCompleted).length || 0;
    return Math.round((completedChapters / totalChapters) * 100);
  });

  /**
   * 获取指定剧情的进度
   */
  async function fetchStoryProgress(storyId: string) {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await getStoryProgress(storyId);

      if (response.success) {
        currentProgress.value = response.data;
      } else {
        error.value = response.message || '获取进度失败';
      }
    } catch (err: any) {
      error.value = err.message || '获取进度失败';
      console.error('获取剧情进度失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取所有剧情进度
   */
  async function fetchAllProgresses() {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await getAllStoryProgress();

      if (response.success) {
        allProgresses.value = response.data;
      } else {
        error.value = response.message || '获取进度列表失败';
      }
    } catch (err: any) {
      error.value = err.message || '获取进度列表失败';
      console.error('获取所有剧情进度失败:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 初始化章节
   */
  async function initChapter(storyId: string, chapterId: number) {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await initializeChapter(storyId, chapterId);

      if (response.success) {
        // 刷新当前进度
        await fetchStoryProgress(storyId);
        return response.data;
      } else {
        error.value = response.message || '初始化章节失败';
        throw new Error(response.message);
      }
    } catch (err: any) {
      error.value = err.message || '初始化章节失败';
      console.error('初始化章节失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 更新任务进度
   */
  async function updateProgress(
    storyId: string,
    chapterId: number,
    taskId: number,
    taskData: {
      isCompleted: boolean;
      score: number;
      maxScore?: number;
      taskData?: any;
      userPerformance?: any;
      feedback?: any;
    }
  ) {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await updateTaskProgress(storyId, chapterId, taskId, taskData);

      if (response.success) {
        // 刷新当前进度
        await fetchStoryProgress(storyId);
        return response.data;
      } else {
        error.value = response.message || '更新进度失败';
        throw new Error(response.message);
      }
    } catch (err: any) {
      error.value = err.message || '更新进度失败';
      console.error('更新任务进度失败:', err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 获取章节进度
   */
  async function fetchChapterProgress(storyId: string, chapterId: number) {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await getChapterProgress(storyId, chapterId);

      if (response.success) {
        return response.data;
      } else {
        error.value = response.message || '获取章节进度失败';
        return null;
      }
    } catch (err: any) {
      error.value = err.message || '获取章节进度失败';
      console.error('获取章节进度失败:', err);
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 重置剧情进度
   */
  async function resetProgress(storyId: string) {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await resetStoryProgress(storyId);

      if (response.success) {
        // 刷新所有进度
        await fetchAllProgresses();
        return true;
      } else {
        error.value = response.message || '重置进度失败';
        return false;
      }
    } catch (err: any) {
      error.value = err.message || '重置进度失败';
      console.error('重置剧情进度失败:', err);
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 清除错误
   */
  function clearError() {
    error.value = null;
  }

  return {
    // 状态
    currentProgress,
    allProgresses,
    isLoading,
    error,

    // 计算属性
    currentChapter,
    completionPercentage,

    // 方法
    fetchStoryProgress,
    fetchAllProgresses,
    initChapter,
    updateProgress,
    fetchChapterProgress,
    resetProgress,
    clearError
  };
}
