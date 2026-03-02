import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

function getHistoryMessages(): Promise<ApiResponse> {
    return request.get('/aiApi/history_messages');
}

function restartConversation(): Promise<ApiResponse> {
    return request.post('/aiApi/restartConversation');
}

interface PracticeWord {
    id: string;
    word: string;
    chineseMeaning: string;
    phonetic: string;
    status: string;
    priority: number;
    reviewCounts: number;
}

interface PracticeWordsResponse {
    words: PracticeWord[];
    total: number;
}

function getPracticeWords(): Promise<ApiResponse<PracticeWordsResponse>> {
    return request.get('/aiApi/practice_words');
}

export { getHistoryMessages, restartConversation, getPracticeWords };
export type { PracticeWord, PracticeWordsResponse };
