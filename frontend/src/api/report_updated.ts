
import request from '@/utils/request';

// 每日学习报告数据类型定义
export interface DailyStudyReport {
  date: string;                    // 日期，格式: YYYY-MM-DD
  totalStudyTime: number;           // 总学习时长（分钟）
  moduleStudyTime: {               // 各模块学习时长
    vocabulary: number;            // 词汇学习时长
    listening: number;             // 听力练习时长
    spelling: number;              // 拼写练习时长
    aiPractice: number;            // AI练习时长
  };
  wordsLearned: {                  // 单词学习统计
    newWords: number;              // 新学单词数
    reviewWords: number;          // 复习单词数
  };
  practiceStats: {                 // 练习统计
    spellingAccuracy: number;      // 拼写正确率（0-100）
    listeningCompletion: number;   // 听力完成度（0-100）
    aiPracticeCount: number;       // AI练习次数
  };
  achievements: {                  // 成就统计
    continuousDays: number;        // 连续学习天数
    totalDays: number;             // 累计学习天数
    unlockedAchievements: string[] // 已解锁成就ID列表
  };
  efficiency: {                   // 效率指标
    wordsPerMinute: number;       // 每分钟学习单词数
    masteryRate: number;          // 单词掌握率
    masterySpeed: number;         // 掌握速度
  };
}

// 学习进度趋势数据类型定义
export interface StudyProgressTrend {
  date: string;                    // 日期，格式: YYYY-MM-DD
  studyTime: number;               // 学习时长（分钟）
  wordsCount: number;              // 学习单词数
}

// 学习效率趋势数据类型定义
export interface EfficiencyTrend {
  date: string;                    // 日期，格式: YYYY-MM-DD
  studyTime: number;               // 学习时长（分钟）
  wordsCount: number;              // 学习单词数
  wordsPerMinute: number;          // 每分钟学习单词数
  masteryRate: number;             // 单词掌握率
  masterySpeed: number;            // 掌握速度
}

// 历史对比数据类型定义
export interface HistoricalComparison {
  lastWeek: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
  lastMonth: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
  allTime: {
    wordsPerMinute: number;
    masteryRate: number;
    masterySpeed: number;
  };
}

// 成就数据类型定义
export interface Achievement {
  id: string;                      // 成就ID
  name: string;                    // 成就名称
  description: string;             // 成就描述
  icon: string;                    // 成就图标
  unlocked: boolean;               // 是否已解锁
  unlockedDate?: string;           // 解锁日期，格式: YYYY-MM-DD
  progress?: {                     // 解锁进度（未解锁时显示）
    current: number;               // 当前进度
    target: number;                // 目标值
  };
}

// 学习建议数据类型定义
export interface StudySuggestion {
  id: string;
  type: string;                   // 建议类型: vocabulary, listening, spelling, aiPractice
  icon: string;
  title: string;
  description: string;
  actionUrl: string;              // 操作链接
}

// API响应类型定义
interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

interface AxiosApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: any;
  config: any;
}

// 获取每日学习报告
/**
 * 获取指定日期的每日学习报告
 * @param date - 日期，格式: YYYY-MM-DD，默认为今天
 * @returns 返回一个Promise，解析为每日学习报告数据
 */
function getDailyStudyReport(date?: string): Promise<AxiosApiResponse<ApiResponse<DailyStudyReport>>> {
  return request({
    url: '/report/daily',
    method: 'get',
    params: { date }
  });
}

// 获取学习进度趋势
/**
 * 获取指定时间范围内的学习进度趋势
 * @param startDate - 开始日期，格式: YYYY-MM-DD
 * @param endDate - 结束日期，格式: YYYY-MM-DD
 * @returns 返回一个Promise，解析为学习进度趋势数据数组
 */
function getStudyProgressTrend(startDate: string, endDate: string): Promise<AxiosApiResponse<ApiResponse<StudyProgressTrend[]>>> {
  return request({
    url: '/report/trend',
    method: 'get',
    params: { startDate, endDate }
  });
}

// 获取学习效率趋势
/**
 * 获取指定时间范围内的学习效率趋势
 * @param startDate - 开始日期，格式: YYYY-MM-DD
 * @param endDate - 结束日期，格式: YYYY-MM-DD
 * @returns 返回一个Promise，解析为学习效率趋势数据数组
 */
function getEfficiencyTrend(startDate: string, endDate: string): Promise<AxiosApiResponse<ApiResponse<EfficiencyTrend[]>>> {
  return request({
    url: '/report/efficiency-trend',
    method: 'get',
    params: { startDate, endDate }
  });
}

// 获取历史对比数据
/**
 * 获取用户的历史对比数据
 * @returns 返回一个Promise，解析为历史对比数据
 */
function getHistoricalComparison(): Promise<AxiosApiResponse<ApiResponse<HistoricalComparison>>> {
  return request({
    url: '/report/historical-comparison',
    method: 'get'
  });
}

// 获取成就列表
/**
 * 获取用户的成就列表
 * @returns 返回一个Promise，解析为成就数据数组
 */
function getAchievements(): Promise<AxiosApiResponse<ApiResponse<Achievement[]>>> {
  return request({
    url: '/report/achievements',
    method: 'get'
  });
}

// 获取学习建议
/**
 * 获取个性化学习建议
 * @returns 返回一个Promise，解析为学习建议数据
 */
function getStudySuggestions(): Promise<AxiosApiResponse<ApiResponse<{ suggestions: StudySuggestion[] }>>> {
  return request({
    url: '/report/suggestions',
    method: 'get'
  });
}

export {
  getDailyStudyReport,
  getStudyProgressTrend,
  getEfficiencyTrend,
  getHistoricalComparison,
  getAchievements,
  getStudySuggestions
};
export type { ApiResponse, AxiosApiResponse };
