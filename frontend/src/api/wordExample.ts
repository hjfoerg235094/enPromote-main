import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

// 生成单词例句
function generateWordExample(wordId: string): Promise<ApiResponse> {
    return request({
        url: '/word/generateExample',
        method: 'post',
        data: { wordId }
    });
}

export {
    generateWordExample
};
