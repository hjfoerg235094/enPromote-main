import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

interface Story {
    storyId: string;
    title: string;
    description: string;
    totalChapters: number;
}

interface Chapter {
    chapterId: number;
    title: string;
    scene: string;
    isLocked: boolean;
}

interface Task {
    id: number;
    type: string;
    name: string;
    description: string;
    requiredWords: string[];
    minWords: number;
    hints: string[];
    systemPrompt: string;
    completionCriteria: any;
    isCompleted: boolean;
}

interface ChapterDetail {
    chapterId: number;
    title: string;
    scene: string;
    aiRole: string;
    userRole: string;
    storyBackground: string;
    tasks: Task[];
    completionCriteria: any;
    nextChapterHint: string;
}

interface StoryProgress {
    currentChapter: number;
    completedChapters: number[];
    totalScore: number;
    startedAt: string;
    lastPlayedAt: string;
    completedAt: string | null;
}

interface ChapterProgress {
    chapterId: number;
    progress: number;
    completedCount: number;
    totalTasks: number;
    isCompleted: boolean;
}

// 获取可用剧情列表
export function getStoryList(): Promise<ApiResponse<{ stories: Story[] }>> {
    return request({
        url: '/story/list',
        method: 'get'
    });
}

// 获取剧情详情
export function getStoryDetail(storyId: string): Promise<ApiResponse<{ story: any }>> {
    return request({
        url: `/story/${storyId}`,
        method: 'get'
    });
}

// 获取用户进度
export function getStoryProgress(storyId: string): Promise<ApiResponse<{
    progress: StoryProgress;
    chapterProgress: ChapterProgress[];
}>> {
    return request({
        url: `/story/${storyId}/progress`,
        method: 'get'
    });
}

// 开始章节
export function startChapter(storyId: string, chapterId: number): Promise<ApiResponse<{ chapter: ChapterDetail }>> {
    return request({
        url: `/story/${storyId}/chapter/${chapterId}/start`,
        method: 'post'
    });
}

// 完成任务
export function completeTask(
    storyId: string,
    chapterId: number,
    taskId: number,
    taskData: any
): Promise<ApiResponse<{ feedback: any; canCompleteChapter: boolean; progress: StoryProgress }>> {
    return request({
        url: `/story/${storyId}/chapter/${chapterId}/task/${taskId}/complete`,
        method: 'post',
        data: taskData
    });
}

// 完成章节
export function completeChapter(
    storyId: string,
    chapterId: number
): Promise<ApiResponse<{ progress: StoryProgress; nextChapter: number }>> {
    return request({
        url: `/story/${storyId}/chapter/${chapterId}/complete`,
        method: 'post'
    });
}
