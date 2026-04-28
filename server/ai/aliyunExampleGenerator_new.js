const { aliyunApiKey: apiKey, aliyunBaseUrl: baseUrl } = require('../config/serve');
const Word = require('../modules/Word');
const { logger } = require('../utils/logger');

function resolveApiEndpoint(rawBaseUrl) {
    const normalizedBaseUrl = (rawBaseUrl || 'https://dashscope.aliyuncs.com/compatible-mode/v1').replace(/\/+$/, '');

    if (normalizedBaseUrl.endsWith('/chat/completions')) {
        return normalizedBaseUrl;
    }

    if (normalizedBaseUrl.endsWith('/compatible-mode/v1')) {
        return `${normalizedBaseUrl}/chat/completions`;
    }

    return `${normalizedBaseUrl}/compatible-mode/v1/chat/completions`;
}

// 使用阿里云百炼 DashScope 的 OpenAI 兼容模式端点。
const API_ENDPOINT = resolveApiEndpoint(baseUrl);
const MISSING_EXAMPLE_TEXT = '暂无例句';

function isUsableExample(example) {
    return Boolean(example && example.trim() && example.trim() !== MISSING_EXAMPLE_TEXT);
}

console.log('阿里云百炼API配置:', {
    hasApiKey: !!apiKey,
    apiKeyPrefix: apiKey ? apiKey.substring(0, 8) + '...' : 'none',
    baseUrl,
    apiEndpoint: API_ENDPOINT
});

/**
 * 为单词生成词义
 * @param {string} word - 单词
 * @returns {Promise<string>} 生成的词义
 */
async function generateWordMeaning(word) {
    try {
        console.log(`开始为单词"${word}"生成词义`);

        // 使用阿里云百炼API生成词义
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个英语教学助手，擅长为英语学习者提供准确的单词释义。'
                    },
                    {
                        role: 'user',
                        content: `请为英语单词"${word}"生成一个简单易懂的中文释义，要求：
1. 准确表达单词的核心含义
2. 简洁明了，不超过50个字
3. 只返回释义，不要其他解释

释义：`
                    }
                ],
                max_tokens: 100,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('阿里云百炼API响应:', data);

        let meaning = '';
        // 兼容模式响应格式
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            meaning = data.choices[0].message.content.trim();
        } else if (data.output && data.output.text) {
            meaning = data.output.text.trim();
        } else if (data.output && data.output.choices && data.output.choices.length > 0) {
            meaning = data.output.choices[0].message.content.trim();
        }

        logger.info(`为单词"${word}"生成词义成功: ${meaning}`);
        console.log(`为单词"${word}"生成词义成功: ${meaning}`);
        return meaning;
    } catch (error) {
        logger.error(`为单词"${word}"生成词义失败:`, error);
        console.error(`为单词"${word}"生成词义失败:`, error);
        return '';
    }
}

/**
 * 为单词生成例句
 * @param {string} word - 单词
 * @param {string} meaning - 单词释义
 * @returns {Promise<string>} 生成的例句
 */
async function generateExampleSentence(word, meaning) {
    try {
        console.log(`开始为单词"${word}"生成例句，含义: ${meaning}`);

        // 使用阿里云百炼API生成例句
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'qwen-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个英语教学助手，擅长为英语学习者生成简单易懂的例句。'
                    },
                    {
                        role: 'user',
                        content: `请为英语单词"${word}"（含义：${meaning}）生成一个简单易懂的英语例句，例句应该：
1. 使用日常生活中的场景
2. 语法简单，适合初学者
3. 能够帮助理解单词的用法
4. 只返回例句，不要其他解释

例句：`
                    }
                ],
                max_tokens: 100,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('阿里云百炼API响应:', data);

        let example = '';
        // 兼容模式响应格式
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            example = data.choices[0].message.content.trim();
        } else if (data.output && data.output.text) {
            example = data.output.text.trim();
        } else if (data.output && data.output.choices && data.output.choices.length > 0) {
            example = data.output.choices[0].message.content.trim();
        }

        logger.info(`为单词"${word}"生成例句成功: ${example}`);
        console.log(`为单词"${word}"生成例句成功: ${example}`);
        return example;
    } catch (error) {
        logger.error(`为单词"${word}"生成例句失败:`, error);
        console.error(`为单词"${word}"生成例句失败:`, error);
        return '';
    }
}

/**
 * 为单词生成词义并保存到数据库
 * @param {string} wordId - 单词ID
 * @returns {Promise<string>} 生成的词义
 */
async function generateAndSaveMeaning(wordId) {
    try {
        // 查找单词
        const word = await Word.findById(wordId);
        if (!word) {
            logger.error(`单词ID ${wordId} 不存在`);
            return '';
        }

        // 检查是否已有词义
        if (word.chineseMeaning) {
            return word.chineseMeaning;
        }

        // 生成词义
        const meaning = await generateWordMeaning(word.word);
        if (!meaning) {
            return '';
        }

        // 保存词义到数据库
        word.chineseMeaning = meaning;
        await word.save();
        logger.info(`为单词"${word.word}"保存词义成功`);
        return meaning;
    } catch (error) {
        logger.error(`为单词ID ${wordId}生成并保存词义失败:`, error);
        return '';
    }
}

/**
 * 为单词生成例句并保存到数据库
 * @param {string} wordId - 单词ID
 * @returns {Promise<string>} 生成的例句
 */
async function generateAndSaveExample(wordId) {
    try {
        // 查找单词
        const word = await Word.findById(wordId);
        if (!word) {
            logger.error(`单词ID ${wordId} 不存在`);
            return '';
        }

        // 检查是否已有例句
        if (word.meanings && word.meanings.length > 0 &&
            word.meanings[0].definitions && word.meanings[0].definitions.length > 0 &&
            isUsableExample(word.meanings[0].definitions[0].example)) {
            return word.meanings[0].definitions[0].example;
        }

        // 获取或生成单词释义
        let meaning = word.chineseMeaning || '';
        if (!meaning) {
            // 如果没有词义，先生成词义
            meaning = await generateAndSaveMeaning(wordId);
            if (!meaning) {
                logger.warn(`单词"${word.word}"没有释义，无法生成例句`);
                return '';
            }
        }

        // 生成例句
        const example = await generateExampleSentence(word.word, meaning);
        if (!example) {
            return '';
        }

        // 保存例句到数据库
        if (!word.meanings || word.meanings.length === 0) {
            word.meanings = [{
                partOfSpeech: 'unknown',
                definitions: [{
                    definition: meaning,
                    example: example
                }]
            }];
        } else {
            if (!word.meanings[0].definitions || word.meanings[0].definitions.length === 0) {
                word.meanings[0].definitions = [{
                    definition: meaning,
                    example: example
                }];
            } else {
                word.meanings[0].definitions[0].example = example;
            }
        }

        await word.save();
        logger.info(`为单词"${word.word}"保存例句成功`);
        return example;
    } catch (error) {
        logger.error(`为单词ID ${wordId}生成并保存例句失败:`, error);
        return '';
    }
}

module.exports = {
    generateWordMeaning,
    generateExampleSentence,
    generateAndSaveMeaning,
    generateAndSaveExample
};
