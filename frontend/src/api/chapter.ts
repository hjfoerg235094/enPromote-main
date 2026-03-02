import request from '@/utils/request';

// 章节相关的API接口

interface ChapterConfig {
    id: string;
    name: string;
    description: string;
    scene: string;
    vocabularyFile: string;
    aiPromptKey: string;
}

interface WordListParams {
    chapter: string;
    index?: number;
}

interface WordListResponse {
    words: any[];
    wordListLen: number;
    total: number;
    currentIndex: number;
    hasMore: boolean;
    chapter: string;
    mode: 'chapter' | 'letter';
}

interface AIQuestionParams {
    chapter: string;
    PositionType: string;
    wordList: any[];
}

interface AIChatParams {
    chapter: string;
}

// 获取章节对应的单词列表
function getChapterWords(params: WordListParams): Promise<{ data: { code: number; data: WordListResponse } }> {
    return request.get('/word/getWordList', {
        params: {
            chapter: params.chapter,
            index: params.index || 0
        }
    });
}

// 生成章节对应的AI题目
function generateChapterQuestions(data: AIQuestionParams & { aiProvider?: string }): Promise<any> {
    return request.post('/question/generate', {
        chapter: data.chapter,
        level: 4, // 固定为第四关
        aiProvider: data.aiProvider || 'aliyun' // 默认使用阿里云百炼
    });
}

// 开始章节对应的AI对话
function startChapterChat(data: AIChatParams): Promise<any> {
    return request.post('/aiApi/startTaskChat', {
        chapter: data.chapter
    });
}

// 获取章节配置信息
function getChapterConfig(chapterId: string): ChapterConfig | null {
    const chapterConfigs: Record<string, ChapterConfig> = {
        A: {
            id: 'A',
            name: '酒店场景',
            description: '学习酒店入住、退房等相关英语',
            scene: 'hotel',
            vocabularyFile: 'A.json',
            aiPromptKey: 'A'
        },
        B: {
            id: 'B',
            name: '餐厅场景',
            description: '学习餐厅点餐、用餐等相关英语',
            scene: 'restaurant',
            vocabularyFile: 'B.json',
            aiPromptKey: 'B'
        }
    };
    
    return chapterConfigs[chapterId] || null;
}

// 验证章节ID是否有效
function isValidChapter(chapterId: string): boolean {
    return ['A', 'B'].includes(chapterId);
}

export {
    getChapterWords,
    generateChapterQuestions,
    startChapterChat,
    getChapterConfig,
    isValidChapter
};

export type {
    ChapterConfig,
    WordListParams,
    WordListResponse,
    AIQuestionParams,
    AIChatParams
};