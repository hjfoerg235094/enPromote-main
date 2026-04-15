import request from '../utils/request';
import { blobToPCM16kMono } from '../utils/audioPcm';

/**
 * 口语评测接口
 */
export interface OralEvaluationRequest {
  audio: Blob;
  text: string;
  category?: 'word' | 'sentence' | 'paragraph' | 'free';
  level?: 'primary' | 'junior' | 'senior' | 'college';
}

/**
 * 评测维度
 */
export interface EvaluationDimensions {
  accuracy: number;    // 发音准确度
  fluency: number;     // 流利度
  integrity: number;    // 完整度
  pronunciation: number; // 发音
  speed?: number;      // 语速
  intonation?: number; // 声调/语调
}

/**
 * 评测建议
 */
export interface EvaluationAdvice {
  overall: string;
  accuracy: string;
  fluency: string;
  integrity: string;
  pronunciation: string;
  speed?: string;
  intonation?: string;
}

/**
 * 评测结果
 */
export interface OralEvaluationResult {
  overallScore: number;
  dimensions: EvaluationDimensions;
  details: {
    words: Array<{
      text: string;
      score: number;
      timeLen: number;
    }>;
    phonemes: Array<{
      text: string;
      score: number;
    }>;
  };
  advice: EvaluationAdvice;
}

/**
 * API响应
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 单次口语评测
 */
export const evaluatePronunciation = async (
  params: OralEvaluationRequest
): Promise<ApiResponse<OralEvaluationResult>> => {
  const pcmAudio = await blobToPCM16kMono(params.audio);

  const formData = new FormData();
  formData.append('audio', pcmAudio, 'recording.pcm');
  formData.append('text', params.text);
  if (params.category) {
    formData.append('category', params.category);
  }
  if (params.level) {
    formData.append('level', params.level);
  }

  return request.post('/oral/evaluate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 批量口语评测
 */
export const batchEvaluatePronunciation = async (
  params: {
    audio: Blob;
    texts: string[];
    category?: 'word' | 'sentence' | 'paragraph' | 'free';
    level?: 'primary' | 'junior' | 'senior' | 'college';
  }
): Promise<ApiResponse<OralEvaluationResult[]>> => {
  const pcmAudio = await blobToPCM16kMono(params.audio);

  const formData = new FormData();
  formData.append('audio', pcmAudio, 'recording.pcm');
  formData.append('texts', JSON.stringify(params.texts));
  if (params.category) {
    formData.append('category', params.category);
  }
  if (params.level) {
    formData.append('level', params.level);
  }

  return request.post('/oral/batch-evaluate', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * 获取评测配置
 */
export const getEvaluationConfig = async (): Promise<
  ApiResponse<{
    categories: Record<string, string>;
    levels: Record<string, string>;
  }>
> => {
  return request.get('/oral/config');
};
