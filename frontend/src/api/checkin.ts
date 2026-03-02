import request from '@/utils/request';

// 签到数据类型定义
export interface CheckInData {
  continuousCheckInDays: number;
  totalCheckInDays: number;
  hasCheckedInToday: boolean;
  reward?: {
    coins: number;
    bonus: number;
    total: number;
  };
}

export interface CheckInStatusData {
  continuousCheckInDays: number;
  totalCheckInDays: number;
  hasCheckedInToday: boolean;
  monthCheckInDays: Array<{
    date: number;
    checkedIn: boolean;
  }>;
  currentMonth: number;
  currentYear: number;
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

// 执行签到
function dailyCheckIn(): Promise<AxiosApiResponse<ApiResponse<CheckInData>>> {
  return request.post('/checkin/daily');
}

// 获取签到状态
function getCheckInStatus(): Promise<AxiosApiResponse<ApiResponse<CheckInStatusData>>> {
  return request.get('/checkin/status');
}

export { dailyCheckIn, getCheckInStatus };
export type { ApiResponse, AxiosApiResponse };
