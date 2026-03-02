import request from '@/utils/request';

// 学习质量评估数据类型定义
export interface StudyQualityAssessment {
  overallScore: number;            // 学习质量得分（0-100）
  dimensions: {                    // 质量维度分析
    memory: QualityDimension;      // 记忆维度
    understanding: QualityDimension; // 理解维度
    application: QualityDimension; // 应用维度
  };
  trend: QualityTrend[];          // 质量变化趋势
  suggestions: QualitySuggestion[]; // 质量改进建议
}

// 质量维度数据类型
export interface QualityDimension {
  score: number;                  // 维度得分（0-100）
  level: string;                  // 维度等级（优秀、良好、一般、需改进）
  description: string;             // 维度描述
  metrics: {                      // 维度具体指标
    accuracy?: number;             // 正确率
    retention?: number;           // 记忆保持率
    comprehension?: number;       // 理解度
    usage?: number;               // 应用能力
  };
}

// 质量趋势数据类型
export interface QualityTrend {
  date: string;                   // 日期，格式: YYYY-MM-DD
  overallScore: number;            // 综合得分
  memoryScore: number;             // 记忆维度得分
  understandingScore: number;      // 理解维度得分
  applicationScore: number;        // 应用维度得分
}

// 质量改进建议数据类型
export interface QualitySuggestion {
  id: string;
  type: string;                   // 建议类型: memory, understanding, application
  icon: string;
  title: string;
  description: string;
  priority: string;               // 优先级（高、中、低）
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

// 获取学习质量评估
/**
 * 获取用户的学习质量评估
 * @param date - 日期，格式: YYYY-MM-DD，默认为今天
 * @param days - 获取趋势数据的天数，默认为7天
 * @returns 返回一个Promise，解析为学习质量评估数据
 */
function getStudyQualityAssessment(date?: string, days?: number): Promise<AxiosApiResponse<ApiResponse<StudyQualityAssessment>>> {
  return request({
    url: '/report/quality',
    method: 'get',
    params: { date, days }
  });
}

export {
  getStudyQualityAssessment
};
export type { ApiResponse, AxiosApiResponse };
