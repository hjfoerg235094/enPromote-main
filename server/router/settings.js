const express = require('express');
const router = express.Router();
const UserSettings = require('../modules/UserSettings');
const { logger, logApiError, logUserAction } = require('../utils/logger');

/**
 * 获取用户设置
 * GET /api/settings
 */
router.get('/', async (req, res) => {
    try {
        const { userid } = req.session;

        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        let settings = await UserSettings.findOne({ userId: userid });

        // 如果设置不存在，创建默认设置
        if (!settings) {
            settings = new UserSettings({ userId: userid });
            await settings.save();
        }

        res.json({
            code: 200,
            message: 'success',
            data: settings
        });
    } catch (error) {
        logger.error('获取用户设置失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取用户设置失败'
        });
    }
});

/**
 * 更新用户设置
 * PUT /api/settings
 * Body: { privacy, notification }
 */
router.put('/', async (req, res) => {
    try {
        const { userid } = req.session;
        const { privacy, notification } = req.body;

        if (!userid) {
            return res.json({
                code: 401,
                message: '请先登录'
            });
        }

        let settings = await UserSettings.findOne({ userId: userid });

        if (!settings) {
            settings = new UserSettings({ userId: userid });
        }

        // 更新隐私设置
        if (privacy) {
            if (privacy.showInRanking !== undefined) {
                settings.privacy.showInRanking = privacy.showInRanking;
            }
            if (privacy.showProgressToFriends !== undefined) {
                settings.privacy.showProgressToFriends = privacy.showProgressToFriends;
            }
            if (privacy.allowFriendRequest !== undefined) {
                settings.privacy.allowFriendRequest = privacy.allowFriendRequest;
            }
            if (privacy.showOnlineStatus !== undefined) {
                settings.privacy.showOnlineStatus = privacy.showOnlineStatus;
            }
        }

        // 更新通知设置
        if (notification) {
            if (notification.rankingChange !== undefined) {
                settings.notification.rankingChange = notification.rankingChange;
            }
            if (notification.friendActivity !== undefined) {
                settings.notification.friendActivity = notification.friendActivity;
            }
            if (notification.friendRequest !== undefined) {
                settings.notification.friendRequest = notification.friendRequest;
            }
        }

        await settings.save();

        // 记录操作
        logUserAction(req, 'UPDATE_SETTINGS', {
            userId: userid,
            privacy: settings.privacy,
            notification: settings.notification
        });

        res.json({
            code: 200,
            message: '设置更新成功',
            data: settings
        });
    } catch (error) {
        logger.error('更新用户设置失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '更新用户设置失败'
        });
    }
});

module.exports = router;
