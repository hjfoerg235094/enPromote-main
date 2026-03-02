import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

interface FavoriteWord {
    id: string;
    wordId: string;
    word: string;
    meaning: string;
    phonetic: string;
    example: string;
    status: string;
    reviewCounts: number;
    priority: number;
    addedAt: Date;
}

interface AddFavoriteParams {
    wordId: string;
}

interface RemoveFavoriteParams {
    wordId: string;
}

interface CheckFavoriteParams {
    wordId: string;
}

// 获取收藏单词列表
function getFavoriteWords(): Promise<ApiResponse<{ data: FavoriteWord[] }>> {
    return request({
        url: '/favoriteWords/list',
        method: 'get'
    });
}

// 添加单词到收藏
function addFavoriteWord(params: AddFavoriteParams): Promise<ApiResponse<{ data: { wordId: string; word: string; isFavorite: boolean } }>> {
    return request({
        url: '/favoriteWords/add',
        method: 'post',
        data: params
    });
}

// 取消收藏单词
function removeFavoriteWord(params: RemoveFavoriteParams): Promise<ApiResponse<{ data: { wordId: string; isFavorite: boolean } }>> {
    return request({
        url: '/favoriteWords/remove',
        method: 'post',
        data: params
    });
}

// 检查单词是否已收藏
function checkFavoriteWord(params: CheckFavoriteParams): Promise<ApiResponse<{ data: { isFavorite: boolean } }>> {
    return request({
        url: '/favoriteWords/check',
        method: 'get',
        params
    });
}

export {
    getFavoriteWords,
    addFavoriteWord,
    removeFavoriteWord,
    checkFavoriteWord
};
export type { FavoriteWord };
