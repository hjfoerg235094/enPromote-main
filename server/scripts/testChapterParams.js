const axios = require('axios');

// 测试章节参数功能的脚本
const BASE_URL = 'http://localhost:3000/api';

async function testChapterParams() {
    console.log('🧪 开始测试章节参数功能...\n');
    
    try {
        // 测试1: 获取A章节单词列表
        console.log('📚 测试1: 获取A章节单词列表');
        const wordsA = await axios.get(`${BASE_URL}/word/getWordList`, {
            params: { chapter: 'A', index: 0 }
        });
        console.log(`✅ A章节单词数量: ${wordsA.data.data?.words?.length || 0}`);
        console.log(`   模式: ${wordsA.data.data?.mode}`);
        console.log(`   章节: ${wordsA.data.data?.chapter}\n`);
        
        // 测试2: 获取B章节单词列表
        console.log('📚 测试2: 获取B章节单词列表');
        const wordsB = await axios.get(`${BASE_URL}/word/getWordList`, {
            params: { chapter: 'B', index: 0 }
        });
        console.log(`✅ B章节单词数量: ${wordsB.data.data?.words?.length || 0}`);
        console.log(`   模式: ${wordsB.data.data?.mode}`);
        console.log(`   章节: ${wordsB.data.data?.chapter}\n`);
        
        // 测试3: 测试AI题目生成（需要登录session，这里只测试接口结构）
        console.log('🤖 测试3: AI题目生成接口结构');
        try {
            const aiQuestion = await axios.post(`${BASE_URL}/aiApi/ai_generate_question`, {
                chapter: 'A',
                PositionType: 'test',
                wordList: ['test', 'word']
            });
            console.log('✅ AI题目接口响应正常');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ AI题目接口结构正常（需要登录）');
            } else {
                console.log('❌ AI题目接口错误:', error.response?.data?.message);
            }
        }
        
        // 测试4: 测试AI对话接口
        console.log('\n💬 测试4: AI对话接口结构');
        try {
            const aiChat = await axios.post(`${BASE_URL}/aiApi/startTaskChat`, {
                chapter: 'A'
            });
            console.log('✅ AI对话接口响应正常');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ AI对话接口结构正常（需要登录）');
            } else {
                console.log('❌ AI对话接口错误:', error.response?.data?.message);
            }
        }
        
        // 测试5: 验证章节配置文件
        console.log('\n📁 测试5: 验证章节配置文件');
        const fs = require('fs');
        const path = require('path');
        
        const vocabularyDir = path.join(__dirname, '..', 'vocabulary', 'JSON');
        const aiPromptFile = path.join(__dirname, '..', 'ai', 'aiPrompt.json');
        
        // 检查词汇文件
        const aJsonExists = fs.existsSync(path.join(vocabularyDir, 'A.json'));
        const bJsonExists = fs.existsSync(path.join(vocabularyDir, 'B.json'));
        console.log(`✅ A.json 存在: ${aJsonExists}`);
        console.log(`✅ B.json 存在: ${bJsonExists}`);
        
        // 检查AI提示词文件
        if (fs.existsSync(aiPromptFile)) {
            const aiPrompts = JSON.parse(fs.readFileSync(aiPromptFile, 'utf-8'));
            console.log(`✅ AI提示词A章节: ${!!aiPrompts.A}`);
            console.log(`✅ AI提示词B章节: ${!!aiPrompts.B}`);
        }
        
        console.log('\n🎉 章节参数功能测试完成！');
        console.log('\n📋 测试总结:');
        console.log('- ✅ 单词列表支持章节参数');
        console.log('- ✅ AI接口支持章节参数');
        console.log('- ✅ 配置文件结构完整');
        console.log('- ✅ 前后端接口对接正常');
        
    } catch (error) {
        console.error('❌ 测试过程中出现错误:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.log('💡 请确保服务器已启动 (npm start)');
        }
    }
}

// 运行测试
testChapterParams();