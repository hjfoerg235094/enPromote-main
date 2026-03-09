import request from '@/utils/request';

// 记录词汇学习
export function recordVocabularyStudy(data: {
  userId: string;
  date?: Date | string;
  studyTime: number;
  newWords: number;
  reviewWords: number;
}) {
  return request({
    url: '/study-record/vocabulary',
    method: 'post',
    data
  });
}

// 记录听力练习
export function recordListeningPractice(data: {
  userId: string;
  date?: Date | string;
  studyTime: number;
  completion: number;
}) {
  return request({
    url: '/study-record/listening',
    method: 'post',
    data
  });
}

// 记录拼写练习
export function recordSpellingPractice(data: {
  userId: string;
  date?: Date | string;
  studyTime: number;
  accuracy: number;
}) {
  return request({
    url: '/study-record/spelling',
    method: 'post',
    data
  });
}

// 记录AI练习
export function recordAIPractice(data: {
  userId: string;
  date?: Date | string;
  studyTime: number;
  count: number;
}) {
  return request({
    url: '/study-record/ai-practice',
    method: 'post',
    data
  });
}
