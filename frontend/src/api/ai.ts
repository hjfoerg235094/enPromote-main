import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
        data: T;
    };
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

interface OralCoachFeedbackRequest {
    targetText: string;
    evaluation: unknown;
    mode?: string;
    useEnglish?: boolean;
    practiceWords?: string[];
}

interface OralCoachFeedback {
    feedback: string;
    nextAction: 'retry' | 'next';
    retryText: string;
    nextPrompt: string;
    nextTargetText: string;
}

function getOralCoachFeedback(data: OralCoachFeedbackRequest): Promise<ApiResponse<OralCoachFeedback>> {
    return request.post('/aiApi/oralCoachFeedback', data);
}

export { getHistoryMessages, restartConversation, getPracticeWords, getOralCoachFeedback };
export type { PracticeWord, PracticeWordsResponse };
