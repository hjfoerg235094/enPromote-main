
import axios from 'axios';

const API_BASE_URL = '/api/vocabulary-learning';

/**
 * 获取用户学习进度
 * @returns {Promise} 学习进度信息
 */
export function getLearningProgress() {
  return axios.get(`${API_BASE_URL}/progress`);
}

/**
 * 获取学习单词列表
 * @param {Object} params - 查询参数
 * @param {string} params.chapter - 章节字母 (A-Z)
 * @param {number} params.startIndex - 起始索引 (默认0)
 * @param {number} params.count - 单词数量 (默认20)
 * @returns {Promise} 单词列表
 */
export function getLearningWords(params) {
  return axios.get(`${API_BASE_URL}/words`, { params });
}

/**
 * 更新学习进度
 * @param {Object} data - 学习进度数据
 * @param {number} data.studiedWords - 本次学习的单词数
 * @param {string} data.chapter - 当前章节
 * @param {number} data.newIndex - 新的索引位置
 * @returns {Promise} 更新后的进度信息
 */
export function updateLearningProgress(data) {
  return axios.post(`${API_BASE_URL}/progress`, data);
}

/**
 * 记录单词学习结果
 * @param {Object} data - 单词学习数据
 * @param {string} data.word - 单词
 * @param {string} data.status - 学习状态 (know, vague, unknown)
 * @returns {Promise} 更新后的单词学习状态
 */
export function recordWordLearning(data) {
  return axios.post(`${API_BASE_URL}/word`, data);
}

/**
 * 批量记录单词学习结果
 * @param {Array} words - 单词学习数据数组
 * @param {string} words[].word - 单词
 * @param {string} words[].status - 学习状态
 * @returns {Promise} 更新后的单词学习状态数组
 */
export function batchRecordWordLearning(words) {
  return axios.post(`${API_BASE_URL}/words/batch`, { words });
}

/**
 * 获取需要复习的单词
 * @param {Object} params - 查询参数
 * @param {number} params.limit - 返回数量限制 (默认20)
 * @returns {Promise} 需要复习的单词列表
 */
export function getReviewWords(params) {
  return axios.get(`${API_BASE_URL}/review`, { params });
}

/**
 * 切换到下一章节
 * @returns {Promise} 新的章节信息
 */
export function moveToNextChapter() {
  return axios.post(`${API_BASE_URL}/next-chapter`);
}

/**
 * 获取学习统计
 * @returns {Promise} 学习统计数据
 */
export function getLearningStatistics() {
  return axios.get(`${API_BASE_URL}/statistics`);
}
