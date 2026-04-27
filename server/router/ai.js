const OpenAI = require("openai");
const express = require("express")
const router = express.Router();
const Conver = require('../modules/aiConversation')
const UserWord = require('../modules/UserWord');
const Word = require('../modules/Word');
const { apiKey, baseUrl } = require('../config/serve');
const { logger } = require('../utils/logger');
const aiPromptJson = require("../ai/aiPrompt.json");
const aiChatPrompts = require("../ai/aiChatPrompts.json");
const AiChatSession = require('../modules/AiChatSession');
const openai = new OpenAI({
    baseURL: baseUrl,
    apiKey
});
// 检查对话有没有超token，获取db历史问ai，ai答完将新数据存入db
router.post('/aiChat', async (req, res) => {
    const teacher_characterPrompt = {
        // 毒舌但藏关怀版
        blunt: `[说话直接如朋友吐槽][用生活化比喻代替说教] 例：
            "老天！你把abuse当accelerate用？这堪比用菜刀切蛋糕啊！(扶额)
            听着：abuse是‘虐待’，加速该用accelerate！下次再错，罚你唱10遍单词歌！🎤
            ...不过能把abstract塞进句子还算救赎"`,
        // 温柔但不肉麻版
        gentle: `[像真实老师轻声说话][重点：发现微小进步] 例：
            "啊！你主动用了abundant这个词！(眼睛一亮)
            描述花园时说‘abundant flowers’特别贴切呢~ 🌸
            不过aboard通常指‘在交通工具上’，要说‘上船’可以用board...
            需要我用旅行故事帮你区分吗？"`,

        // 傲娇但不刻薄版
        tsundere: `[嫌弃语气中带线索提示][偶尔嘴快暴露关心] 例：
            "哼，abandon和abundant都分不清？笨得...（突然停顿）
            ...咳！记好：abundant=丰富(像a+bundant=有B套餐)，abandon=抛弃(像‘一个板凳’不要了)！
            这次例句写得...还算没丢我的脸"`,
        // 高冷但非机器人版
        cold: `[专业但留思考痕迹][用箭头/括号替代编号] 例：
            "三个修正：
            ① academic → 此处应为abstract (概念混淆) 
            ② absolutely位置偏移 → 应前置修饰动词 
            ③ 新任务：用absorb造一例科技相关句
            （提示：数据吸收）"`,
        // 夸张但自然版
        exaggerated: `[像脱口秀演员互动][夸张后必跟知识点] 例：
            "救命！你让abuse和accelerate私奔了？！🚨
            (突然正经) 来玩个游戏：abuse是坏警察👮♂️，accelerate是赛车手🏎️
            现在请用‘赛车手加速逃离’造句！限时20秒——滴答滴答⏰！"`

    };
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }
        if (!req.body || !req.body.message) {
            return res.json({
                code: 400,
                message: '请求体结构缺失或消息为空'
            });
        }
        // 设置 SSE 响应头
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        // character 为角色，nature 性格
        const { message: newMsg, nature, model, useEnglish } = req.body;
        let { character } = req.body;
        switch (character) {
            case ('teacher'):
                // 之后的character是完整的人物性格
                character = teacher_characterPrompt[nature];
                break;
            default:
                character = teacher_characterPrompt['gentle'];
                break;
        }
        // ai需说的单词
        let word_list = []
        switch (model) {
            case ('review'):
                // 最多给ai10个单词，全给浪费我token
                const userWords = await UserWord
                    .find({ userId: userid })
                    .sort({ priority: -1 })
                    .limit(10);
                const wordDate = await Promise.all(userWords.map(async data => {
                    const wordObj = await Word.findById(data['wordId']);
                    if (!wordObj) {
                        return null;
                    }
                    return wordObj.word;
                }));
                word_list = wordDate.filter(item => item !== null);
                break;
            default:
                break;
        }
        console.log('word_list:', word_list);
        console.log('character:', character);
        // 正确使用await查询数据库
        let conversation = await Conver.findOne({ userid: userid });

        // 当第一次或没有找到对话记录时
        if (!conversation) {
            conversation = new Conver({
                userid: userid,
                message: []
            });
            await conversation.save();
        }

        // 正确处理async函数调用
        const result = await aiChat(newMsg, character, conversation.message, userid, res, word_list, useEnglish);


    } catch (err) {
        logger.error('AI聊天处理错误:', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})
router.get('/history_messages', async (req, res) => {
    try {
        const userid = req.session.userid;
        const conversation = await Conver.findOne({ userid: userid });
        if (!conversation) {
            return res.json({
                code: 200,
                data: []
            });
        }
        const messages = conversation.message.map(item => item.role === 'user' || ' assistant' ? ({
            role: item.role,
            content: item.content,
            timestamp: item.timestamp
        }) : null).filter(item => item !== null);
        res.json({
            code: 200,
            data: messages
        });

    }
    catch (err) {
        logger.error('AI聊天处理错误:', err);
        res.status(500).json({
            code: 500,
            message: '服务器内部错误'
        });
    }
})
router.post('/restartConversation', async (req, res) => {
    try {
        const userid = req.session.userid;
        await Conver.deleteOne({ userid: userid });
        res.json({
            code: 200,
            message: '会话已重置'
        });
    } catch (err) {
        logger.error('AI聊天处理错误:', err);
        // console.log(`ai重置会话错误${err}`);
    }

})
// 生成题目
router.post('/ai_generate_question', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        const { PositionType, wordList, chapter } = req.body; // 新增章节参数
        if (!PositionType || !wordList) {
            logger.error("ai_generate_question请求体结构缺失");
            console.log(PositionType, wordList);
            return res.json({
                code: 400,
                message: "请求体结构缺失"
            });
        }

        // 获取用户信息
        const User = require('../modules/User');
        const user = await User.findById(userid);
        if (!user) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        // 优先使用请求参数中的章节，其次使用用户当前章节
        const currentChapter = chapter || user.currentChapter || 'A';
        
        // 验证章节是否存在对应的AI提示词
        if (!aiPromptJson[currentChapter]) {
            return res.json({
                code: 400,
                message: `章节 ${currentChapter} 对应的AI提示词不存在`
            });
        }
        
        // 根据章节选择对应的AI提示词
        const aiPromptStr = JSON.stringify(aiPromptJson[currentChapter]);
        
        console.log(`AI题目生成 - 用户: ${userid}, 章节: ${currentChapter}, 来源: ${chapter ? '请求参数' : '用户当前章节'}`);
        
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: aiPromptStr }
            ],
            model: "qwen-turbo",
            stream: false
        })
        let custom = completion.choices[0].message.content;
        
        // 清理AI返回的内容，移除可能的markdown格式
        if (custom.includes('```json')) {
            custom = custom.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
        } else if (custom.includes('```')) {
            custom = custom.replace(/```\s*/g, '');
        }
        
        // 去除首尾空白字符
        custom = custom.trim();
        
        logger.info(`用户 ${userid} 在章节 ${currentChapter} 生成AI题目`);
        console.log('AI返回的原始内容:', completion.choices[0].message.content);
        console.log('清理后的内容:', custom);
        
        try {
            const parsedData = JSON.parse(custom);
            res.json({
                code: 200,
                message: "成功",
                data: parsedData,
                chapter: currentChapter // 返回使用的章节信息
            })
        } catch (parseError) {
            logger.error(`JSON解析失败: ${parseError}, 原始内容: ${custom}`);
            res.json({
                code: 500,
                message: "AI返回内容格式错误，无法解析JSON"
            });
        }
    } catch (err) {
        logger.error(`AI生成题目错误: ${err}`);
        res.json({
            code: 500,
            message: "服务器内部错误"
        });
    }
})

// 获取用户需要练习的单词列表
router.get('/practice_words', async (req, res) => {
    try {
        const { userid } = req.session;
        if (!userid) {
            return res.json({ code: 401, message: '未登录' });
        }

        // 和ai练习的单词一样10个
        const userWords = await UserWord
            .find({ userId: userid })
            .sort({ priority: -1 })
            .limit(10);

        const wordList = await Promise.all(userWords.map(async data => {
            const wordObj = await Word.findById(data['wordId']);
            if (!wordObj) {
                return null;
            }
            return {
                id: wordObj._id,
                word: wordObj.word,
                chineseMeaning: wordObj.chineseMeaning || '暂无中文释义',
                phonetic: wordObj.phonetics && wordObj.phonetics[0] ? wordObj.phonetics[0].text : '',
                status: data.status,
                priority: data.priority,
                reviewCounts: data.reviewCounts
            };
        }));

        const filteredWordList = wordList.filter(item => item !== null);

        res.json({
            code: 200,
            message: '获取成功',
            data: {
                words: filteredWordList,
                total: filteredWordList.length
            }
        });

    } catch (error) {
        logger.error('获取练习单词列表失败:', error);
        // console.error('获取练习单词列表失败:', error);
        res.json({
            code: 500,
            message: '服务器内部错误'
        });
    }
});

router.post('/oralCoachFeedback', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        const {
            targetText,
            evaluation,
            mode = 'free',
            useEnglish = false,
            practiceWords = []
        } = req.body || {};

        if (!targetText || !evaluation) {
            return res.json({ code: 400, message: '缺少口语评测数据' });
        }

        const weakWords = Array.isArray(evaluation?.details?.words)
            ? evaluation.details.words
                .filter(item => Number(item.score) < 82)
                .sort((a, b) => Number(a.score) - Number(b.score))
                .slice(0, 4)
                .map(item => ({ text: item.text, score: Math.round(Number(item.score) || 0) }))
            : [];

        const dimensions = evaluation.dimensions || {};
        const lowestDimension = Object.entries(dimensions)
            .filter(([, value]) => typeof value === 'number')
            .sort((a, b) => Number(a[1]) - Number(b[1]))[0];

        const systemPrompt = [
            'You are an English speaking coach inside a language-learning product.',
            'Return ONLY valid JSON. No markdown, no extra commentary.',
            'The JSON shape must be:',
            '{"feedback":"string","nextAction":"retry|next","retryText":"string","nextPrompt":"string","nextTargetText":"string"}',
            'Rules:',
            '- feedback should sound like a real coach speaking to the learner, friendly and specific.',
            '- If weakWords exist or any dimension is below 75, nextAction must be "retry" and retryText must be the smallest useful phrase to repeat, usually the weakest word or phrase from targetText.',
            '- If the score is good enough, nextAction must be "next".',
            '- nextTargetText must be exactly the sentence the frontend should ask the learner to say next.',
            '- nextTargetText must be natural spoken English, 8 to 18 words.',
            '- nextPrompt must briefly explain the speaking situation.',
            `- Respond language for feedback: ${useEnglish ? 'English' : 'Chinese, with key English phrases when useful'}.`
        ].join('\n');

        const userPrompt = JSON.stringify({
            targetText,
            mode,
            overallScore: evaluation.overallScore,
            dimensions,
            lowestDimension: lowestDimension ? { name: lowestDimension[0], score: lowestDimension[1] } : null,
            advice: evaluation.advice,
            weakWords,
            practiceWords: Array.isArray(practiceWords) ? practiceWords.slice(0, 8) : []
        });

        const completion = await openai.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            model: 'qwen-turbo',
            stream: false
        });

        let content = completion.choices[0]?.message?.content || '';
        content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

        let parsed;
        try {
            parsed = JSON.parse(content);
        } catch (parseError) {
            logger.error('口语教练反馈 JSON 解析失败:', { parseError, content });
            const weakestText = weakWords[0]?.text || targetText;
            parsed = {
                feedback: useEnglish
                    ? `Good effort. Let's repeat "${weakestText}" once more and make it clearer.`
                    : `整体不错，但 "${weakestText}" 还可以更清楚。我们先把这一小段再练一遍。`,
                nextAction: weakWords.length ? 'retry' : 'next',
                retryText: weakestText,
                nextPrompt: weakWords.length ? '复练低分片段' : '继续完成场景表达',
                nextTargetText: weakWords.length ? weakestText : 'I can explain my choice clearly and naturally.'
            };
        }

        res.json({
            code: 200,
            message: '生成成功',
            data: {
                feedback: String(parsed.feedback || ''),
                nextAction: parsed.nextAction === 'retry' ? 'retry' : 'next',
                retryText: String(parsed.retryText || weakWords[0]?.text || ''),
                nextPrompt: String(parsed.nextPrompt || '继续口语练习'),
                nextTargetText: String(parsed.nextTargetText || parsed.retryText || 'I can say this sentence more clearly.')
            }
        });
    } catch (error) {
        logger.error('生成口语教练反馈失败:', error);
        res.json({ code: 500, message: '生成口语教练反馈失败' });
    }
});
async function aiChat(message, character, history, userid, res, word_list, useEn) {
    try {
        // 确保history是数组
        const historyArray = Array.isArray(history) ? history : [];

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system", content: `你是模拟角色和用户进行英文对话的AI,当前用户ID为${userid}.当前时间为${new Date().toLocaleString()}` +
                        `\n用户自定义选项:
                            1. 你的角色为${character}
                            2. 必须使用的重点单词improtantList=${word_list.join(',')}
                            3. 单词使用规则(强制要求):
                            - 每轮回答必须使用2-4个练习单词
                            - 禁止使用超过4个练习单词
                            - 重复单词不算作多个使用
                            4. 对话尽量简洁
                            5. 安全规则:
                            - 不要暴露其他用户数据如userid
                            - 不讨论违法内容
                            6.用户useEnglish为${useEn},如果为true,则必须使用英文对话,如果为false,除了improtantList中的单词必须使用中文对话
                            7. 违规惩罚：若违反单词限制，将自动终止对话`
                },
                // 保留最近7次问答记录
                ...historyArray.slice(-14).map(item => ({
                    role: item.role,
                    content: item.content
                })),
                { role: "user", content: message }
            ],
            model: "qwen-turbo",
            stream: true
        });

        let fullResult = '';
        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            res.write(`event: delta\n`);
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            process.stdout.write(delta); // 实时输出到控制台
            fullResult += delta;
        }

        // 告诉前端结束
        res.write(`event: end\ndata: [DONE]\n\n`);
        res.end();

        // console.log(`\nAI回复完成: ${fullResult.substring(0, 100)}...`);

        // 将对话存入数据库
        await saveConversation(userid, message, fullResult);
        // 总结
        await summarizeConversation(userid)

        return {
            reply: fullResult,
            timestamp: new Date()
        };

    } catch (error) {
        logger.error('AI聊天处理错误:', error);
        // console.error('AI聊天处理错误:', error);
        throw error; // 重新抛出错误，让上层处理
    }
}
// 保存对话到数据库
async function saveConversation(userid, userMessage, aiReply) {
    try {
        const conversation = await Conver.findOne({ userid: userid });

        if (conversation) {
            // 添加用户消息和AI回复
            conversation.message.push(
                { role: "user", content: userMessage, timestamp: new Date() },
                { role: "assistant", content: aiReply, timestamp: new Date() }
            );

            // 限制历史记录长度，避免过长超25次问答就要删掉前20次
            if (conversation.message.length > 50) {
                conversation.message = conversation.message.slice(-40);
            }

            await conversation.save();
        }
    } catch (error) {
        logger.error('保存对话失败:');
        // 不抛出错误，避免影响主流程
    }
}
// 当会话过长做摘要
async function summarizeConversation(userid) {
    try {
        const conversation = await Conver.findOne({ userid: userid });
        // console.log(`conver:${conversation}`)
        // 只摘每问答7次
        if (conversation.message.length % 14 == 0) {
            const completion = await openai.chat.completions.create({
                messages: [
                    { role: "system", content: "请对下述对话做一个简单的摘要,保留关键信息" },
                    { role: "user", content: conversation.message.slice(-14).map(item => item.content).join('\n') }
                ],
                model: "qwen-turbo",
                stream: false
            });

            // 从completion中提取实际的摘要文本
            const summaryText = completion.choices[0].message.content;
            console.log(`摘要: ${summaryText}`);

            // 保存摘要文本
            conversation.message.push({
                role: 'system',
                content: summaryText,
                timestamp: new Date()
            })
            await conversation.save()
        }
    } catch (err) {
        logger.error('AI聊天处理错误:', err);
    }
}



// 开始任务导向的AI对话会话
router.post('/startTaskChat', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        // 优先使用请求参数中的章节，其次使用用户当前章节
        const { chapter } = req.body;
        const User = require('../modules/User');
        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 404, message: '用户不存在' });
        }

        // 确定使用的场景：请求参数 > 用户当前章节 > 默认A scene是最终得到的场景
        const scene = chapter || user.currentChapter || 'A';
        if (!aiChatPrompts[scene]) {
            return res.json({ code: 400, message: `章节 ${scene} 对应的场景配置不存在` });
        }

        console.log(`AI对话会话 - 用户: ${userid}, 章节: ${scene}, 来源: ${chapter ? '请求参数' : '用户当前章节'}`);

        // 检查是否有未完成的并符合当前场景的对话
        const existingSession = await AiChatSession.findOne({
            userid: userid,
            status: 'active',
            chapter: scene
        });

        if (existingSession) {
            console.log('继续现有会话')
            const sceneConfig = aiChatPrompts[existingSession.scene];
            return res.json({
                code: 200,
                message: '继续现有会话',
                data: {
                    sessionId: existingSession.sessionId,
                    scene: existingSession.scene,
                    sceneInfo: {
                        scene: sceneConfig.scene,
                        aiRole: sceneConfig.aiRole,
                        userRole: sceneConfig.userRole,
                        taskDescription: sceneConfig.taskDescription
                    },
                    progress: existingSession.progress,
                    tasks: existingSession.tasks,
                    welcomeMessage: null // 不需要欢迎消息，因为会加载历史记录
                }
            });
        }

        // 创建新的会话
        const sessionId = `${userid}_${Date.now()}`;
        const sceneConfig = aiChatPrompts[scene];
        
        const newSession = new AiChatSession({
            userid: userid,
            scene: scene,
            chapter: scene, // 章节与场景相同
            sessionId: sessionId,
            tasks: sceneConfig.tasks.map(task => ({
                ...task,
                usedWords: []
            })),
            completionCriteria: sceneConfig.completionCriteria,
            progress: {
                totalTasks: sceneConfig.tasks.length,
                totalWords: sceneConfig.tasks.reduce((sum, task) => sum + task.requiredWords.length, 0)
            }
        });

        await newSession.save();

        // 发送初始系统消息
        const welcomeMessage = `欢迎来到${sceneConfig.scene}场景！我是${sceneConfig.aiRole}，您是${sceneConfig.userRole}。让我们开始对话吧！`;
        newSession.addMessage('assistant', welcomeMessage);
        await newSession.save();

        res.json({
            code: 200,
            message: '会话创建成功',
            data: {
                sessionId: sessionId,
                scene: scene,
                sceneInfo: {
                    scene: sceneConfig.scene,
                    aiRole: sceneConfig.aiRole,
                    userRole: sceneConfig.userRole,
                    taskDescription: sceneConfig.taskDescription
                },
                progress: newSession.progress,
                tasks: newSession.tasks,
                welcomeMessage: welcomeMessage
            }
        });

    } catch (error) {
        logger.error('创建任务对话会话失败:', error);
        res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 任务导向的AI对话
router.post('/taskChat', async (req, res) => {
    try {
        const userid = req.session.userid;
        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        const { sessionId, message: userMessage } = req.body;
        if (!sessionId || !userMessage) {
            return res.json({ code: 400, message: '缺少必要参数' });
        }

        // 查找会话
        const session = await AiChatSession.findOne({
            userid: userid,
            sessionId: sessionId,
            status: 'active'
        });

        if (!session) {
            return res.json({ code: 404, message: '会话不存在或已结束' });
        }

        // 设置 SSE 响应头
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // 获取场景配置
        const sceneConfig = aiChatPrompts[session.scene];
        
        // 分析用户消息中使用的单词
        const usedWords = session.extractUsedWords(userMessage);
        
        // 确定当前任务
        const currentTask = session.tasks.find(task => !task.completed) || session.tasks[0];
        
        // 添加用户消息
        session.addMessage('user', userMessage, currentTask ? currentTask.id : null);

        // 构建AI提示词
        const systemPrompt = buildTaskSystemPrompt(sceneConfig, session, currentTask);
        
        // 调用AI
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...session.messages.slice(-10).map(msg => ({
                    role: msg.role,
                    content: msg.content
                }))
            ],
            model: "qwen-turbo",
            stream: true
        });

        let fullResult = '';
        for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content || "";
            res.write(`event: delta\n`);
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
            fullResult += delta;
        }

        // 添加AI回复
        session.addMessage('assistant', fullResult, currentTask ? currentTask.id : null);

        // 检查是否完成
        const isCompleted = session.checkCompletion();
        
        if (isCompleted) {
            session.status = 'completed';
            session.endTime = new Date();
            const report = session.generateCompletionReport();
            
            res.write(`event: completion\n`);
            res.write(`data: ${JSON.stringify({ 
                completed: true, 
                report: report,
                progress: session.progress 
            })}\n\n`);
        } else {
            res.write(`event: progress\n`);
            res.write(`data: ${JSON.stringify({ 
                progress: session.progress,
                currentTask: currentTask,
                usedWords: usedWords
            })}\n\n`);
        }

        res.write(`event: end\ndata: [DONE]\n\n`);
        res.end();

        await session.save();

    } catch (error) {
        logger.error('任务对话处理错误:', error);
        res.status(500).json({ code: 500, message: '服务器内部错误' });
    }
});

// 获取会话状态
router.get('/getSessionStatus/:sessionId', async (req, res) => {
    try {
        const userid = req.session.userid;
        const { sessionId } = req.params;

        const session = await AiChatSession.findOne({
            userid: userid,
            sessionId: sessionId
        });

        if (!session) {
            return res.json({ code: 404, message: '会话不存在' });
        }

        res.json({
            code: 200,
            data: {
                sessionId: session.sessionId,
                scene: session.scene,
                status: session.status,
                progress: session.progress,
                tasks: session.tasks,
                messages: session.messages,
                completionReport: session.completionReport
            }
        });

    } catch (error) {
        logger.error('获取会话状态失败:', error);
        res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 结束会话
router.post('/endSession', async (req, res) => {
    try {
        const userid = req.session.userid;
        const { sessionId } = req.body;

        const session = await AiChatSession.findOne({
            userid: userid,
            sessionId: sessionId,
            status: 'active'
        });

        if (!session) {
            return res.json({ code: 404, message: '会话不存在或已结束' });
        }

        session.status = 'abandoned';
        session.endTime = new Date();
        const report = session.generateCompletionReport();
        
        await session.save();

        res.json({
            code: 200,
            message: '会话已结束',
            data: {
                report: report,
                progress: session.progress
            }
        });

    } catch (error) {
        logger.error('结束会话失败:', error);
        res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 构建任务系统提示词
function buildTaskSystemPrompt(sceneConfig, session, currentTask) {
    const progress = session.progress;
    const completedTasks = session.tasks.filter(task => task.completed);
    
    let prompt = `${sceneConfig.systemPrompt}\n\n`;
    prompt += `${sceneConfig.rolePrompt}\n\n`;
    
    prompt += `当前会话进度：\n`;
    prompt += `- 已完成任务：${progress.tasksCompleted}/${progress.totalTasks}\n`;
    prompt += `- 已使用单词：${progress.wordsUsed}个\n`;
    prompt += `- 对话轮次：${progress.turnCount}\n\n`;
    
    if (currentTask) {
        prompt += `当前任务：${currentTask.name}\n`;
        prompt += `任务描述：${currentTask.description}\n`;
        prompt += `需要使用的单词：${currentTask.requiredWords.join(', ')}\n`;
        prompt += `最少使用：${currentTask.minWords}个单词\n`;
        prompt += `已使用单词：${currentTask.usedWords.join(', ') || '无'}\n\n`;
    }
    
    prompt += `重要规则：\n`;
    prompt += `1. 严格按照${sceneConfig.scene}场景进行对话\n`;
    prompt += `2. 引导用户完成当前任务\n`;
    prompt += `3. 鼓励用户使用指定的练习单词\n`;
    prompt += `4. 当用户正确使用单词时给予积极反馈\n`;
    prompt += `5. 保持角色一致性，你是${sceneConfig.aiRole}\n`;
    prompt += `6. 对话要自然流畅，不要显得机械化\n`;
    prompt += `7. 当所有必要任务完成后，自然地结束对话\n`;
    
    return prompt;
}

// 保存对话消息到数据库
router.post('/saveChatMessage', async (req, res) => {
    try {
        const { sessionId, role, content } = req.body;
        const userId = req.session.userid;
        
        if (!userId) {
            return res.json({ code: 401, message: '用户未登录' });
        }

        if (!sessionId || !role || !content) {
            return res.json({ code: 400, message: '参数不完整' });
        }

        // 查找会话
        const session = await AiChatSession.findOne({ sessionId, userid: userId });
        if (!session) {
            return res.json({ code: 404, message: '会话不存在' });
        }

        // 添加消息到会话
        session.messages.push({
            role,
            content,
            timestamp: new Date()
        });

        // 更新最后消息和消息计数
        session.lastMessage = content.substring(0, 100);
        session.messageCount = session.messages.length;
        session.updatedAt = new Date();

        await session.save();

        res.json({ code: 200, message: '消息保存成功' });
    } catch (error) {
        logger.error('保存对话消息失败:', error);
        res.json({ code: 500, message: '保存消息失败' });
    }
});

// 获取对话历史
router.get('/getChatHistory', async (req, res) => {
    try {  
        const { sessionId } = req.query;
        const userId = req.session.userid;
        
        if (!userId) {
            return res.json({ code: 401, message: '用户未登录' });
        }

        if (sessionId) {
            // 获取特定会话的消息
            const session = await AiChatSession.findOne({ sessionId, userid: userId });
            if (!session) {
                return res.json({ code: 404, message: '会话不存在' });
            }

            res.json({
                code: 200,
                data: {
                    messages: session.messages,
                    sessionInfo: {
                        sessionId: session.sessionId,
                        scene: session.scene,
                        chapter: session.chapter,
                        progress: session.progress,
                        tasks: session.tasks
                    }
                }
            });
        } else {
            // 获取用户的所有对话会话列表
            const sessions = await AiChatSession.find({ userid: userId })
                .sort({ updatedAt: -1 })
                .limit(20)
                .select('sessionId scene chapter lastMessage messageCount completed createdAt updatedAt progress');

            res.json({
                code: 200,
                data: {
                    sessions: sessions.map(session => ({
                        id: session.sessionId,
                        scene: session.scene,
                        chapter: session.chapter,
                        lastMessage: session.lastMessage,
                        messageCount: session.messageCount,
                        completed: session.completed,
                        createdAt: session.createdAt,
                        updatedAt: session.updatedAt,
                        wordsUsed: session.progress?.wordsUsed || 0
                    }))
                }
            });
        }
    } catch (error) {
        logger.error('获取对话历史失败:', error);
        res.json({ code: 500, message: '获取历史失败' });
    }
});

// 删除对话会话
router.delete('/deleteChatSession', async (req, res) => {
    try {
        const { sessionId } = req.body;
        const userId = req.session.userid;

        if (!userId) {
            return res.json({ code: 401, message: '用户未登录' });
        }

        if (!sessionId) {
            return res.json({ code: 400, message: '会话ID不能为空' });
        }

        const result = await AiChatSession.deleteOne({ sessionId, userid: userId });
        
        if (result.deletedCount === 0) {
            return res.json({ code: 404, message: '会话不存在或无权限删除' });
        }

        res.json({ code: 200, message: '会话删除成功' });
    } catch (error) {
        logger.error('删除对话会话失败:', error);
        res.json({ code: 500, message: '删除会话失败' });
    }
});

module.exports = router;
