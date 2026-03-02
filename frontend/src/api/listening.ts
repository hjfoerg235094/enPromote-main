
import request from '../utils/request';

/**
 * 生成听力材料和问题
 * @param params - 生成参数
 * @param params.scene - 场景描述，如"机场入境"
 * @param params.targetWords - 目标词汇数组
 * @param params.difficulty - 难度级别，如"初级"、"中级"、"高级"
 * @param params.questionCount - 问题数量，默认3个
 * @returns 生成的听力材料和问题
 */
export function generateListeningContent(params: {
  scene: string;
  targetWords: string[];
  difficulty?: string;
  questionCount?: number;
}) {
  return request({
    url: '/listening/generate',
    method: 'post',
    data: params
  }).then(response => response.data);
}
