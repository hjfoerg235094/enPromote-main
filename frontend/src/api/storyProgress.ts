import request from '../utils/request';

/**
 * 获取用户剧情进度
 */
export function getStoryProgress(storyId: string) {
  return request({
    url: `/story/progress/${storyId}`,
    method: 'get'
  }).then(response => response.data);
}

/**
 * 获取用户所有剧情进度
 */
export function getAllStoryProgress() {
  return request({
    url: '/story/progress',
    method: 'get'
  }).then(response => response.data);
}

/**
 * 初始化章节任务
 */
export function initializeChapter(storyId: string, chapterId: number) {
  return request({
    url: `/story/${storyId}/chapter/${chapterId}/initialize`,
    method: 'post'
  }).then(response => response.data);
}

/**
 * 更新任务进度
 */
export function updateTaskProgress(
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
  return request({
    url: `/story/${storyId}/chapter/${chapterId}/task/${taskId}/progress`,
    method: 'post',
    data: taskData
  }).then(response => response.data);
}

/**
 * 获取章节进度
 */
export function getChapterProgress(storyId: string, chapterId: number) {
  return request({
    url: `/story/${storyId}/chapter/${chapterId}/progress`,
    method: 'get'
  }).then(response => response.data);
}

/**
 * 重置剧情进度
 */
export function resetStoryProgress(storyId: string) {
  return request({
    url: `/story/${storyId}/progress`,
    method: 'delete'
  }).then(response => response.data);
}
