// 第五章：撤离
export const chapter5Data = {
  chapterId: 5,
  title: '第五章：撤离',
  scene: '火车站',
  userRole: '特工',
  aiRole: '检票员',
  storyBackground: '经过一系列紧张的冒险，你终于完成了所有任务。现在你需要撤离这个城市，前往下一个目的地。火车站是唯一的出口，但你必须小心行事，因为你的身份可能已经暴露。',
  tasks: [
    {
      id: 501,
      type: 'dialogue',
      name: '购买车票',
      description: '与检票员对话，购买一张前往安全地点的车票。使用礼貌和自然的英语表达。',
      requiredWords: ['ticket', 'destination', 'departure', 'platform', 'schedule'],
      minWords: 3,
      hints: [
        '使用"Could I have a ticket to..."来请求购买车票',
        '询问发车时间和站台信息',
        '使用礼貌用语，如"please"和"thank you"'
      ],
      systemPrompt: '你是一个火车站的检票员。你需要与特工对话，帮助他购买车票。特工看起来很紧张，但试图保持冷静。你需要自然地询问他的目的地、偏好时间等信息。使用简单、清晰的英语。',
      completionCriteria: {
        minTurns: 4,
        maxTurns: 8,
        minWords: 3,
        scoreThreshold: 60
      }
    },
    {
      id: 502,
      type: 'spelling',
      name: '填写车票信息',
      description: '在车票上填写正确的信息，包括目的地、日期和座位类型。',
      requiredWords: ['destination', 'date', 'time', 'seat', 'class'],
      hints: [
        '注意大小写',
        '日期格式通常是月/日/年',
        '座位类型包括economy（经济）、business（商务）和first class（头等）'
      ],
      systemPrompt: '特工需要填写车票信息。提供正确的拼写提示，但不要直接给出答案。',
      completionCriteria: {
        correctRate: 80,
        minWords: 5
      }
    },
    {
      id: 503,
      type: 'listening',
      name: '听取广播通知',
      description: '仔细听取火车站广播，了解列车时刻表和站台变更信息。',
      requiredWords: ['delay', 'platform', 'departure', 'arrival', 'announcement'],
      hints: [
        '注意听数字和时间',
        '站台号通常会重复播报',
        '留意是否有延误或取消通知'
      ],
      systemPrompt: '播放火车站广播通知，包括列车时刻表、站台变更和延误信息。语速适中，发音清晰。',
      questions: [
        {
          text: '列车将延误多长时间？',
          options: ['10分钟', '15分钟', '20分钟', '30分钟'],
          correct: 1
        },
        {
          text: '列车将从哪个站台出发？',
          options: ['站台1', '站台2', '站台3', '站台4'],
          correct: 3
        },
        {
          text: '广播中提到了什么变更？',
          options: ['时间变更', '站台变更', '取消', '新增班次'],
          correct: 1
        }
      ],
      completionCriteria: {
        correctAnswers: 2,
        totalQuestions: 3
      }
    }
  ],
  completionCriteria: {
    totalTasks: 3,
    requiredTasks: 3,
    minScore: 60
  },
  nextChapterHint: '恭喜！你成功完成了所有任务，顺利撤离。下一章将开始新的冒险旅程！'
}
