const express = require('express');
const User = require('../modules/User');
const { logger, logApiError, logUserAction } = require('../utils/logger');
const router = express.Router();

// 签到接口
router.post('/daily', async (req, res) => {
    try {
        const { userid } = req.session;

        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 404, message: '用户不存在' });
        }

        // 初始化签到数据
        if (!user.checkIn) {
            user.checkIn = {
                lastCheckInDate: null,
                continuousCheckInDays: 0,
                totalCheckInDays: 0,
                checkInRewards: new Map()
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastCheckInDate = user.checkIn.lastCheckInDate;

        // 检查今天是否已经签到
        if (lastCheckInDate) {
            const lastCheckInDay = new Date(lastCheckInDate);
            lastCheckInDay.setHours(0, 0, 0, 0);

            if (lastCheckInDay.getTime() === today.getTime()) {
                return res.json({ 
                    code: 400, 
                    message: '今日已签到',
                    data: {
                        continuousCheckInDays: user.checkIn.continuousCheckInDays,
                        totalCheckInDays: user.checkIn.totalCheckInDays,
                        hasCheckedInToday: true
                    }
                });
            }
        }

        // 计算连续签到天数
        let continuousDays = 1;
        if (lastCheckInDate) {
            const lastCheckInDay = new Date(lastCheckInDate);
            lastCheckInDay.setHours(0, 0, 0, 0);

            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            if (lastCheckInDay.getTime() === yesterday.getTime()) {
                continuousDays = user.checkIn.continuousCheckInDays + 1;
            }
        }

        // 更新签到数据
        user.checkIn.lastCheckInDate = new Date();
        user.checkIn.continuousCheckInDays = continuousDays;
        user.checkIn.totalCheckInDays += 1;

        // 计算奖励
        let reward = {
            coins: 10, // 基础奖励
            bonus: 0,  // 连续签到奖励
            total: 10  // 总奖励
        };

        // 连续签到奖励
        if (continuousDays >= 7) {
            reward.bonus = 20; // 连续7天额外奖励
        } else if (continuousDays >= 3) {
            reward.bonus = 10; // 连续3天额外奖励
        }

        reward.total = reward.coins + reward.bonus;

        // 保存签到奖励记录
        if (!user.checkIn.checkInRewards) {
            user.checkIn.checkInRewards = new Map();
        }

        const rewardKey = today.toISOString().split('T')[0];
        user.checkIn.checkInRewards.set(rewardKey, true);

        await user.save();

        // 记录签到操作
        logUserAction(req, 'CHECK_IN', {
            userId: userid,
            continuousDays,
            totalDays: user.checkIn.totalCheckInDays,
            reward
        });

        return res.json({
            code: 200,
            message: '签到成功',
            data: {
                continuousCheckInDays: user.checkIn.continuousCheckInDays,
                totalCheckInDays: user.checkIn.totalCheckInDays,
                hasCheckedInToday: true,
                reward
            }
        });
    } catch (error) {
        logger.error('签到失败:', error);
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

// 获取签到状态接口
router.get('/status', async (req, res) => {
    try {
        const { userid } = req.session;

        if (!userid) {
            return res.json({ code: 401, message: '请先登录' });
        }

        const user = await User.findById(userid);
        if (!user) {
            return res.json({ code: 404, message: '用户不存在' });
        }

        // 初始化签到数据
        if (!user.checkIn) {
            user.checkIn = {
                lastCheckInDate: null,
                continuousCheckInDays: 0,
                totalCheckInDays: 0,
                checkInRewards: new Map()
            };
            await user.save();
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastCheckInDate = user.checkIn.lastCheckInDate;
        let hasCheckedInToday = false;

        if (lastCheckInDate) {
            const lastCheckInDay = new Date(lastCheckInDate);
            lastCheckInDay.setHours(0, 0, 0, 0);

            hasCheckedInToday = lastCheckInDay.getTime() === today.getTime();
        }

        // 获取本月签到记录
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const monthCheckInDays = [];

        // 遍历本月每一天
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const dateKey = date.toISOString().split('T')[0];
            monthCheckInDays.push({
                date: day,
                checkedIn: user.checkIn.checkInRewards ? user.checkIn.checkInRewards.get(dateKey) || false : false
            });
        }

        return res.json({
            code: 200,
            message: '获取签到状态成功',
            data: {
                continuousCheckInDays: user.checkIn.continuousCheckInDays,
                totalCheckInDays: user.checkIn.totalCheckInDays,
                hasCheckedInToday,
                monthCheckInDays,
                currentMonth: currentMonth + 1,
                currentYear
            }
        });
    } catch (error) {
        logger.error('获取签到状态失败:', error);
        logApiError(req, error, 500);
        return res.json({ code: 500, message: '服务器内部错误' });
    }
});

module.exports = router;
