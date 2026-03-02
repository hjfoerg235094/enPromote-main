import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

interface WordListParams {
    [key: string]: any;
}

interface WordProgressData {
    [key: string]: any;
}

interface WordInfoParams {
    word: string;
}

interface WordPriorityData {
    word?: string;
    wordId?: string;
    newStatus?: string;
    isCorrect?: boolean;
    [key: string]: any;
}

interface WordAudioParams {
    word: string;
}

// 获取单词列表
/**
 * 获取单词列表的异步函数
 * @param params - 单词列表请求参数
 * @returns 返回一个Promise，解析为ApiResponse类型的响应数据
 */
function getWordList(params: WordListParams): Promise<ApiResponse> {
    // 使用request方法发送GET请求到'/word/getWordList'接口
    return request({
        url: '/word/getWordList', // 请求的URL地址
        method: 'get',           // 请求方法为GET
        params                  // 请求参数
    });
}

// 更新单词学习进度
/**
 * 更新单词学习进度
 * @param data - 包含单词进度信息的对象
 * @returns 返回一个Promise，解析为ApiResponse类型的响应
 */
function updateWordProgress(data: WordProgressData): Promise<ApiResponse> {
    // 发送POST请求到'/word/updateWordProgress'接口
    // 请求方法为post
    // 请求体为传入的data参数
    return request({
        url: '/word/updateWordProgress',
        method: 'post',
        data
    });
}

/**
 * 获取单词信息
 * @param params - 单词信息查询参数
 * @returns 返回一个Promise，解析为ApiResponse类型的响应数据
 */
function getWordInfo(params: WordInfoParams): Promise<ApiResponse> {
    // 使用request方法发起GET请求
    return request({
        url: '/word/getWordInfo', // 请求的API端点
        method: 'get', // 请求方法为GET
        params // 请求参数
    });
}

// 获取用户单词进度
function getWordProgress(): Promise<ApiResponse> {
    return request.get('/word/getWordProgress');
}

// 提交单词复习结果
function submitWordReview(data: WordPriorityData): Promise<ApiResponse> {
    return request({
        url: '/word/submitReview',
        method: 'post',
        data
    });
}

// 获取需要复习的单词
function getReviewWords(): Promise<ApiResponse> {
    return request({
        url: '/word/getReviewWords',
        method: 'get',
    });
}

// 获取单词发音
function getWordAudio(params: WordAudioParams): Promise<ApiResponse> {
    return request({
        url: '/word/getWordAudio',
        method: 'get',
        params
    });
}

// 获取用户学习统计
function getUserStats(): Promise<ApiResponse> {
    return request({
        url: '/word/getUserStats',
        method: 'get',
    });
}

export { 
    getWordList, 
    updateWordProgress, 
    getWordInfo, 
    getWordProgress, 
    submitWordReview,
    submitWordReview as updateWordPriority,
    getReviewWords, 
    getWordAudio,
    getUserStats
};

