
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
      phonemes?: Array<{
        text: string;
        score: number;
      }>;
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

export type EvaluationCategory = 'word' | 'sentence' | 'paragraph' | 'free';
export type EvaluationLevel = 'primary' | 'junior' | 'senior' | 'college';

/**
 * 单次口语评测
 */
export const evaluatePronunciation = async (
  params: OralEvaluationRequest
): Promise<ApiResponse<OralEvaluationResult>> => {
  // 检查音频是否已经是 PCM 格式
  let pcmAudio = params.audio;

  // 只有当音频不是 PCM 格式时才进行转换
  // 录音时已经生成了正确的 PCM 格式音频 (audio/l16)
  const audioName = params.audio instanceof File ? params.audio.name : '';
  if (params.audio.type !== 'audio/l16' && !audioName.endsWith('.pcm')) {
    // MediaRecorder 输出往往不是 raw PCM，而讯飞后端配置 aue=raw，
    // 所以这里先转成 16kHz/16-bit/mono 的 Int16 little-endian bytes。
    pcmAudio = await blobToPCM16kMono(params.audio);
  }

  const formData = new FormData();
  formData.append('audio', pcmAudio, 'recording.pcm');
  formData.append('text', params.text);
  if (params.category) {
    formData.append('category', params.category);
  }
  if (params.level) {
    formData.append('level', params.level);
  }

  const response = await request.post<ApiResponse<OralEvaluationResult>>('/oral/evaluate', formData);
  return response.data;
};

/**
 * 批量口语评测
 */
export const batchEvaluatePronunciation = async (
  params: {
    audio: Blob;
    texts: string[];
    category?: EvaluationCategory;
    level?: EvaluationLevel;
  }
): Promise<ApiResponse<OralEvaluationResult[]>> => {
  const pcmAudio = params.audio.type === 'audio/l16'
    ? params.audio
    : await blobToPCM16kMono(params.audio);

  const formData = new FormData();
  formData.append('audio', pcmAudio, 'recording.pcm');
  formData.append('texts', JSON.stringify(params.texts));
  if (params.category) {
    formData.append('category', params.category);
  }
  if (params.level) {
    formData.append('level', params.level);
  }

  const response = await request.post<ApiResponse<OralEvaluationResult[]>>('/oral/batch-evaluate', formData);
  return response.data;
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
  const response = await request.get<
    ApiResponse<{
      categories: Record<string, string>;
      levels: Record<string, string>;
    }>
  >('/oral/config');
  return response.data;
};
