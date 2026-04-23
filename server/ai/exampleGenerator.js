const OpenAI = require("openai");
const { apiKey, baseUrl } = require('../config/serve');
const Word = require('../modules/Word');
const { logger } = require('../utils/logger');

const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey
});

/**
 * 为单词生成词义
 * @param {string} word - 单词
 * @returns {Promise<string>} 生成的词义
 */
async function generateWordMeaning(word) {
    try {
        const prompt = `请为英语单词"${word}"生成一个简单易懂的中文释义，要求：
1. 准确表达单词的核心含义
2. 简洁明了，不超过50个字
3. 只返回释义，不要其他解释

释义：`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "你是一个英语教学助手，擅长为英语学习者提供准确的单词释义。" },
                { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 100,
            temperature: 0.3
        });

        const meaning = completion.choices[0].message.content.trim();
        logger.info(`为单词"${word}"生成词义成功: ${meaning}`);
        return meaning;
    } catch (error) {
        logger.error(`为单词"${word}"生成词义失败:`, error);
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
        const prompt = `请为英语单词"${word}"（含义：${meaning}）生成一个简单易懂的英语例句，例句应该：
1. 使用日常生活中的场景
2. 语法简单，适合初学者
3. 能够帮助理解单词的用法
4. 只返回例句，不要其他解释

例句：`;

        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "你是一个英语教学助手，擅长为英语学习者生成简单易懂的例句。" },
                { role: "user", content: prompt }
            ],
            model: "gpt-3.5-turbo",
            max_tokens: 100,
            temperature: 0.7
        });

        const example = completion.choices[0].message.content.trim();
        logger.info(`为单词"${word}"生成例句成功: ${example}`);
        return example;
    } catch (error) {
        logger.error(`为单词"${word}"生成例句失败:`, error);
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
            word.meanings[0].definitions[0].example) {
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
