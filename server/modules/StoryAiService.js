const OpenAI = require("openai");
const { apiKey, baseUrl } = require('../config/serve');
const storyAiPrompts = require('../ai/storyAiPrompts.json');

const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey
});

/**
 * 剧情模式AI服务
 */
class StoryAiService {
    /**
     * 对话任务 - AI角色扮演
     */
    static async dialogue(task, userMessage, conversationHistory) {
        try {
            const prompt = storyAiPrompts.dialogue;
            const systemPrompt = this.buildSystemPrompt(prompt, task);

            const messages = [
                { role: "system", content: systemPrompt },
                ...this.formatConversationHistory(conversationHistory),
                { role: "user", content: userMessage }
            ];

            const completion = await openai.chat.completions.create({
                messages,
                model: "qwen-turbo",
                stream: true
            });

            return completion;
        } catch (error) {
            console.error('对话任务AI错误:', error);
            throw error;
        }
    }

    /**
     * 拼写任务 - 生成拼写练习
     */
    static async spelling(task) {
        try {
            const prompt = storyAiPrompts.spelling;
            const systemPrompt = this.buildSystemPrompt(prompt, task);

            const completion = await openai.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: systemPrompt + "

请为以下单词生成拼写练习:
" + 
                            task.requiredWords.join(", ") 
                    }
                ],
                model: "qwen-turbo",
                stream: false
            });

            const content = completion.choices[0].message.content;
            return this.parseSpellingResponse(content);
        } catch (error) {
            console.error('拼写任务AI错误:', error);
            throw error;
        }
    }

    /**
     * 听力任务 - 生成听力材料
     */
    static async listening(task) {
        try {
            const prompt = storyAiPrompts.listening;
            const systemPrompt = this.buildSystemPrompt(prompt, task);

            const completion = await openai.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: systemPrompt + "

请生成听力材料，包含以下关键词:
" + 
                            task.requiredWords.join(", ")
                    }
                ],
                model: "qwen-turbo",
                stream: false
            });

            const content = completion.choices[0].message.content;
            return this.parseListeningResponse(content);
        } catch (error) {
            console.error('听力任务AI错误:', error);
            throw error;
        }
    }

    /**
     * 阅读任务 - 生成阅读材料
     */
    static async reading(task) {
        try {
            const prompt = storyAiPrompts.reading;
            const systemPrompt = this.buildSystemPrompt(prompt, task);

            const completion = await openai.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: systemPrompt + "

请生成阅读材料，包含以下关键词:
" + 
                            task.requiredWords.join(", ")
                    }
                ],
                model: "qwen-turbo",
                stream: false
            });

            const content = completion.choices[0].message.content;
            return this.parseReadingResponse(content);
        } catch (error) {
            console.error('阅读任务AI错误:', error);
            throw error;
        }
    }

    /**
     * 生成个性化反馈
     */
    static async generateFeedback(taskType, score, userPerformance) {
        try {
            const prompt = storyAiPrompts.feedback;
            const feedbackLevel = this.getFeedbackLevel(score);

            const completion = await openai.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: `${prompt.system}

任务类型: ${taskType}
得分: ${score}
用户表现: ${JSON.stringify(userPerformance)}`
                    }
                ],
                model: "qwen-turbo",
                stream: false
            });

            const content = completion.choices[0].message.content;
            return {
                message: this.selectRandomMessage(feedbackLevel.messages),
                suggestions: this.selectRandomMessage(feedbackLevel.suggestions),
                customFeedback: content
            };
        } catch (error) {
            console.error('生成反馈错误:', error);
            throw error;
        }
    }

    /**
     * 构建系统提示词
     */
    static buildSystemPrompt(prompt, task) {
        return prompt.system
            .replace('{role}', task.aiRole)
            .replace('{scene}', task.scene) + 
            '

要求:
' + 
            prompt.requirements.map(r => `- ${r}`).join('
');
    }

    /**
     * 格式化对话历史
     */
    static formatConversationHistory(history) {
        if (!Array.isArray(history)) return [];
        return history.slice(-10).map(item => ({
            role: item.role,
            content: item.content
        }));
    }

    /**
     * 解析拼写任务响应
     */
    static parseSpellingResponse(content) {
        try {
            // 清理可能的markdown格式
            if (content.includes('```json')) {
                content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            } else if (content.includes('```')) {
                content = content.replace(/```\s*/g, '');
            }

            return JSON.parse(content.trim());
        } catch (error) {
            console.error('解析拼写响应失败:', error);
            // 返回默认格式
            return {
                words: task.requiredWords.map(word => ({
                    word,
                    phonetic: '',
                    meaning: '',
                    example: '',
                    hint: ''
                }))
            };
        }
    }

    /**
     * 解析听力任务响应
     */
    static parseListeningResponse(content) {
        try {
            if (content.includes('```json')) {
                content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            } else if (content.includes('```')) {
                content = content.replace(/```\s*/g, '');
            }

            return JSON.parse(content.trim());
        } catch (error) {
            console.error('解析听力响应失败:', error);
            return {
                text: '',
                questions: []
            };
        }
    }

    /**
     * 解析阅读任务响应
     */
    static parseReadingResponse(content) {
        try {
            if (content.includes('```json')) {
                content = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
            } else if (content.includes('```')) {
                content = content.replace(/```\s*/g, '');
            }

            return JSON.parse(content.trim());
        } catch (error) {
            console.error('解析阅读响应失败:', error);
            return {
                title: '',
                content: '',
                vocabulary: [],
                questions: []
            };
        }
    }

    /**
     * 获取反馈等级
     */
    static getFeedbackLevel(score) {
        const levels = storyAiPrompts.feedback.levels;

        if (score >= levels.excellent.minScore) {
            return levels.excellent;
        } else if (score >= levels.good.minScore) {
            return levels.good;
        } else if (score >= levels.fair.minScore) {
            return levels.fair;
        } else {
            return levels.needsImprovement;
        }
    }

    /**
     * 随机选择消息
     */
    static selectRandomMessage(messages) {
        if (!Array.isArray(messages) || messages.length === 0) {
            return '';
        }
        return messages[Math.floor(Math.random() * messages.length)];
    }
}

module.exports = StoryAiService;
