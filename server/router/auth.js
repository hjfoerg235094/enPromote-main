const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../modules/User');
const { logger, logApiError, logUserAction } = require('../utils/logger');
const router = express.Router();

const SALT_ROUNDS = 10;

// 判断是否为 bcrypt 哈希（格式 $2a$、$2b$、$2y$）
function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[aby]\$\d{2}\$/.test(str);
}
router.post('/login', async (req, res) => {
    let username, password;
    try {
        ({ username, password } = req.body);
    } catch (err) {
        logApiError(req, err, 400);
        return res.json({ code: 400, message: '错误的请求格式，请求体结构缺失' });
    }

    try {
        const user = await User.findOne({ username });

        if (!user) {
            logUserAction(req, 'LOGIN_FAILED', { username, reason: '用户不存在' });
            return res.json({ code: 400, message: '用户不存在' });
        }

        let passwordValid = false;
        if (isBcryptHash(user.password)) {
            passwordValid = await bcrypt.compare(password, user.password);
            // 登录成功时，若之前是明文密码已通过下方兼容逻辑迁移，此处不会执行
        } else {
            // 兼容旧数据：明文密码，验证后迁移为 bcrypt 哈希
            if (password === user.password) {
                passwordValid = true;
                user.password = await bcrypt.hash(password, SALT_ROUNDS);
                await user.save();
                logger.info(`用户 ${username} 密码已迁移为 bcrypt 哈希`);
            }
        }

        if (passwordValid) {
            // 确保 session 存在
            if (!req.session) {
                req.session = {};
            }

            req.session.userid = user._id;
            req.session.isLogin = true;

            logUserAction(req, 'LOGIN_SUCCESS', { username, userId: user._id });
            logger.info(`用户登录成功: ${username}`);

            return res.json({ code: 200, message: '登录成功' });
        } else {
            logUserAction(req, 'LOGIN_FAILED', { username, reason: '密码错误' });
            return res.json({ code: 400, message: '密码错误' });
        }
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ code: 400, message: '用户名和密码不能为空' });
        }

        const user = await User.findOne({ username });
        if (user) {
            logUserAction(req, 'REGISTER_FAILED', { username, reason: '用户已存在' });
            return res.json({ code: 400, message: '用户已存在' });
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        logUserAction(req, 'REGISTER_SUCCESS', { username, userId: newUser._id });
        logger.info(`新用户注册成功: ${username}`);

        return res.json({ code: 200, message: '注册成功' });
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.post('/logout', (req, res) => {
    try {
        const userId = req.session?.userid;

        req.session.destroy((err) => {
            if (err) {
                logApiError(req, err, 500);
                return res.json({ code: 500, message: '退出登录失败' });
            }

            res.clearCookie('sid');
            logUserAction(req, 'LOGOUT_SUCCESS', { userId });
            logger.info(`用户退出登录: ${userId}`);

            return res.json({ code: 200, message: '退出登录成功' });
        });
    } catch (error) {
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.get('/info', async (req, res) => {
    try {
        // 确保 session 存在
        if (!req.session) {
            return res.status(401).json({ code: 401, message: '未登录', redirect: '/login' });
        }

        const { userid } = req.session || {};
        if (!userid) {
            return res.status(401).json({ code: 401, message: '未登录', redirect: '/login' });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 400, message: '用户不存在' });
        }

        // 计算今日学习单词数
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayWords = user.cet4.todayStudiedWords || 0;

        // 计算连续学习天数
        const streakDays = user.cet4.streakDays || 0;

        logUserAction(req, 'GET_USER_INFO', { userId: userid });

        // 确保用户有chapters字段，如果没有则初始化
        if (!user.chapters || user.chapters.size === 0) {
            user.chapters = new Map([
                ['A', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }],
                ['B', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }]
            ]);
            user.currentChapter = user.currentChapter || 'A';
            await user.save();
        }

        return res.json({
            code: 200,
            message: '获取用户信息成功',
            _id: user._id,
            username: user.username,
            creatTime: user.createTime,
            cet4: user.cet4,
            todayWords: todayWords,
            streakDays: streakDays,
            totalWords: user.totalWords,
            planStudyWords: user.planStudyWords,
            planReviweWords: user.planReviweWords,
            question_completed: user.question_completed,
            ai_choose_completed: user.ai_choose_completed,
            // 新增多章节支持
            chapters: Object.fromEntries(user.chapters),
            currentChapter: user.currentChapter
        });
    } catch (error) {
        logger.error('获取用户信息失败:', error);
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

router.post('/changeinfo', async (req, res) => {
    try {
        const { userid } = req.session;

        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return res.json({ code: 400, message: '请求体不能为空' });
        }

        const { username, password, planStudyWords, planReviweWords, question_completed, ai_choose_completed, wordP, spellP, listenP, customsP, coverP } = req.body;
        const updateData = {};
        const cet4Update = {};
        // 验证用户名
        if (username !== undefined) {
            if (!username || username.trim().length < 2) {
                return res.json({ code: 400, message: '用户名至少需要2个字符' });
            }

            // 检查用户名是否已存在（排除当前用户）
            const existingUser = await User.findOne({
                username: username.trim(),
                _id: { $ne: userid }
            });

            if (existingUser) {
                return res.json({ code: 400, message: '用户名已存在' });
            }

            updateData.username = username.trim();
        }
        // 验证问卷完成状态
        if (question_completed !== undefined) {
            updateData.question_completed = question_completed;
        }
        // 验证AI选择完成状态
        if (ai_choose_completed !== undefined) {
            updateData.ai_choose_completed = ai_choose_completed;
        }
        // 验证密码（修改时需哈希后存储）
        if (password !== undefined) {
            if (!password || password.length < 6) {
                return res.json({ code: 400, message: '密码至少需要6个字符' });
            }
            updateData.password = await bcrypt.hash(password, SALT_ROUNDS);
        }

        // 验证学习计划
        if (planStudyWords !== undefined) {
            const studyWords = parseInt(planStudyWords);
            if (isNaN(studyWords) || studyWords < 1 || studyWords > 100) {
                return res.json({ code: 400, message: '每日学习单词数应在1-100之间' });
            }
            updateData.planStudyWords = studyWords;
        }

        if (planReviweWords !== undefined) {
            const reviewWords = parseInt(planReviweWords);
            if (isNaN(reviewWords) || reviewWords < 1 || reviewWords > 50) {
                return res.json({ code: 400, message: '每日复习单词数应在1-50之间' });
            }
            updateData.planReviweWords = reviewWords;
        }

        // 获取用户当前章节
        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 404, message: '用户不存在' });
        }

        // 确保用户有chapters字段
        if (!user.chapters || user.chapters.size === 0) {
            user.chapters = new Map([
                ['A', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }],
                ['B', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }]
            ]);
            user.currentChapter = user.currentChapter || 'A';
        }

        const currentChapter = user.currentChapter || 'A';

        // 关卡进度更新 - 只更新当前章节，移除cet4冗余字段
        const progressFields = { wordP, spellP, listenP, customsP, coverP };
        for (const field in progressFields) {
            if (progressFields[field] !== undefined) {
                // 只更新当前章节的进度
                const chapterProgress = user.chapters.get(currentChapter) || {};
                chapterProgress[field] = !!progressFields[field];
                user.chapters.set(currentChapter, chapterProgress);
            }
        }

        // 合并所有更新
        const finalUpdate = { ...updateData, ...cet4Update };

        // 保存章节进度
        await user.save();

        // 更新用户信息
        const updatedUser = await User.findByIdAndUpdate(
            userid,
            { $set: finalUpdate },
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return res.json({ code: 404, message: '用户不存在' });
        }


        // 记录操作日志
        logUserAction(req, 'UPDATE_USER_INFO', {
            userId: userid,
            updatedFields: Object.keys(updateData)
        });

        res.json({
            code: 200,
            message: '修改成功',
            data: {
                username: updatedUser.username,
                planStudyWords: updatedUser.planStudyWords,
                planReviweWords: updatedUser.planReviweWords,
                cet4: updatedUser.cet4
            }
        });

    } catch (err) {
        console.error('修改用户信息失败:', err);
        logApiError(req, err, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
})
// 切换章节接口
router.post('/switch-chapter', async (req, res) => {
    try {
        const { userid } = req.session;
        const { chapter } = req.body;

        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        if (!chapter || !['A', 'B'].includes(chapter)) {
            return res.json({ code: 400, message: '无效的章节' });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 404, message: '用户不存在' });
        }

        // 确保用户有chapters字段
        if (!user.chapters || user.chapters.size === 0) {
            user.chapters = new Map([
                ['A', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }],
                ['B', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }]
            ]);
        }

        user.currentChapter = chapter;
        await user.save();

        logUserAction(req, 'SWITCH_CHAPTER', { userId: userid, chapter });

        res.json({
            code: 200,
            message: '切换章节成功',
            currentChapter: chapter,
            chapterProgress: user.chapters.get(chapter)
        });

    } catch (error) {
        console.error('切换章节失败:', error);
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 关卡进度函数
async function advanceToNextStage(userid) {
    const user = await User.findById(userid);
    if (!user) throw new Error('User not found for stage advancement');

    const [letter, number] = user.cet4.position.split(':');
    const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);

    // 更新 position 并重置所有关卡进度
    user.cet4.position = `${nextLetter}:${number}`;
    user.cet4.wordP = false;
    user.cet4.spellP = false;
    user.cet4.listenP = false;
    user.cet4.customsP = false;
    user.cet4.coverP = false;

    await user.save();
}

module.exports = router;