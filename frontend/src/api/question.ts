import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

// 题目类型
export enum QuestionType {
    MULTIPLE_CHOICE = 'multiple_choice',
    FILL_IN_BLANK = 'fill_in_blank',
    LISTENING = 'listening',
    SCENARIO = 'scenario',
    LISTENING_COMPREHENSION = 'listening_comprehension',
    CLOZE_TEST = 'cloze_test',
    TRANSLATION = 'translation',
    WRITING = 'writing',
    TRUE_FALSE = 'true_false'
}

// 题目接口
export interface Question {
    id: string;
    userId: string;
    chapter: string;
    level: number;
    questionType: QuestionType;
    difficulty: number;
    question: string;
    options?: Array<{
        key: string;
        content: string;
    }>;
    correctAnswer: string;
    explanation?: string;
    relatedWords?: Array<{
        wordId?: string;
        word: string;
        meaning: string;
    }>;
    status: string;
    userAnswer?: string;
    isCorrect?: boolean;
    timeSpent?: number;
    createdAt: Date;
    updatedAt: Date;
}

// 生成题目参数
interface GenerateQuestionParams {
    chapter?: string;
    level?: number;
    aiProvider?: 'deepseek' | 'aliyun';  // AI提供商
}

// 提交答案参数
interface SubmitAnswerParams {
    questionId: string;
    answer: string;
    timeSpent?: number;
}

// 获取题目列表参数
interface GetQuestionsParams {
    chapter?: string;
    level?: number;
    status?: string;
}

/**
 * 生成题目
 * @param params 生成题目参数
 * @returns Promise
 */
function generateQuestions(params: GenerateQuestionParams): Promise<ApiResponse> {
    return request({
        url: '/question/generate',
        method: 'post',
        data: params
    });
}

/**
 * 获取题目列表
 * @param params 查询参数
 * @returns Promise
 */
function getQuestions(params: GetQuestionsParams): Promise<ApiResponse<{ data: Question[] }>> {
    return request({
        url: '/question/list',
        method: 'get',
        params
    });
}

/**
 * 提交答案
 * @param params 提交答案参数
 * @returns Promise
 */
function submitAnswer(params: SubmitAnswerParams): Promise<ApiResponse> {
    return request({
        url: '/question/submit',
        method: 'post',
        data: params
    });
}

export {
    generateQuestions,
    getQuestions,
    submitAnswer
};
