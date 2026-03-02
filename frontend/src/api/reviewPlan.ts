import request from '@/utils/request';

interface ApiResponse<T = any> {
    data: {
        code: number;
        message: string;
    } & T;
}

interface ReviewScheduleParams {
    chapter?: string;
    days?: number;
}

interface ReviewStatsParams {
    chapter?: string;
}

// 获取复习计划
function getReviewSchedule(params?: ReviewScheduleParams): Promise<ApiResponse> {
    return request({
        url: '/reviewPlan/getReviewSchedule',
        method: 'get',
        params
    });
}

// 获取复习统计数据
function getReviewStats(params?: ReviewStatsParams): Promise<ApiResponse> {
    return request({
        url: '/reviewPlan/getReviewStats',
        method: 'get',
        params
    });
}

export {
    getReviewSchedule,
    getReviewStats
};
export type { 
    ApiResponse, 
    ReviewScheduleParams, 
    ReviewStatsParams 
};
