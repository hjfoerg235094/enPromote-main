const express = require('express');
const router = express.Router();
const User = require('../modules/User');
const Friendship = require('../modules/Friendship');
const FriendRequest = require('../modules/FriendRequest');
const UserSettings = require('../modules/UserSettings');
const { logger, logApiError, logUserAction } = require('../utils/logger');

/**
 * 搜索用户
 * GET /api/friends/search
 * Query: { username }
 */
router.get('/search', async (req, res) => {
    try {
        const { userid } = req.session;
        const { username } = req.query;

        if (!username) {
            return res.json({
                code: 400,
                message: '请输入用户名'
            });
        }

        // 搜索用户（排除自己）
        const users = await User.find({
            username: { $regex: username, $options: 'i' },
            _id: { $ne: userid }
        }).select('_id username createTime').limit(10);

        // 获取用户设置，过滤不允许添加好友的用户
        const userIds = users.map(u => u._id.toString());
        const settings = await UserSettings.find({
            userId: { $in: userIds },
            'privacy.allowFriendRequest': true
        });

        const allowedUserIds = new Set(settings.map(s => s.userId.toString()));
        const filteredUsers = users.filter(user => allowedUserIds.has(user._id.toString()));

        // 检查是否已经是好友或已发送请求
        const friendships = await Friendship.find({
            userId: userid,
            friendId: { $in: userIds }
        });

        const friendIds = new Set(friendships.map(f => f.friendId.toString()));

        const result = filteredUsers.map(user => ({
            id: user._id,
            username: user.username,
            isFriend: friendIds.has(user._id.toString()),
            joinDate: user.createTime
        }));

        res.json({
            code: 200,
            message: 'success',
            data: result
        });
    } catch (error) {
        logger.error('搜索用户失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '搜索用户失败'
        });
    }
});

/**
 * 发送好友请求
 * POST /api/friends/request
 * Body: { toUserId, message }
 */
router.post('/request', async (req, res) => {
    try {
        const { userid } = req.session;
        const { toUserId, message } = req.body;

        if (!toUserId) {
            return res.json({
                code: 400,
                message: '请选择要添加的好友'
            });
        }

        if (toUserId === userid) {
            return res.json({
                code: 400,
                message: '不能添加自己为好友'
            });
        }

        // 检查目标用户是否存在
        const targetUser = await User.findById(toUserId);
        if (!targetUser) {
            return res.json({
                code: 404,
                message: '用户不存在'
            });
        }

        // 检查目标用户是否允许添加好友
        const settings = await UserSettings.findOne({ userId: toUserId });
        if (settings && !settings.privacy.allowFriendRequest) {
            return res.json({
                code: 403,
                message: '该用户不允许添加好友'
            });
        }

        // 检查是否已经是好友
        const existingFriendship = await Friendship.findOne({
            userId: userid,
            friendId: toUserId,
            status: 'accepted'
        });

        if (existingFriendship) {
            return res.json({
                code: 400,
                message: '已经是好友关系'
            });
        }

        // 检查是否已发送请求
        const existingRequest = await FriendRequest.findOne({
            fromUserId: userid,
            toUserId: toUserId,
            status: 'pending'
        });

        if (existingRequest) {
            return res.json({
                code: 400,
                message: '已发送好友请求，请等待对方处理'
            });
        }

        // 创建好友请求
        const friendRequest = new FriendRequest({
            fromUserId: userid,
            toUserId: toUserId,
            message: message || ''
        });

        await friendRequest.save();

        // 记录操作
        logUserAction(req, 'SEND_FRIEND_REQUEST', {
            fromUserId: userid,
            toUserId: toUserId
        });

        res.json({
            code: 200,
            message: '好友请求已发送'
        });
    } catch (error) {
        logger.error('发送好友请求失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '发送好友请求失败'
        });
    }
});

/**
 * 接受好友请求
 * POST /api/friends/accept
 * Body: { requestId }
 */
router.post('/accept', async (req, res) => {
    try {
        const { userid } = req.session;
        const { requestId } = req.body;

        if (!requestId) {
            return res.json({
                code: 400,
                message: '请求ID不能为空'
            });
        }

        // 查找好友请求
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.json({
                code: 404,
                message: '好友请求不存在'
            });
        }

        // 验证请求是否属于当前用户
        if (friendRequest.toUserId !== userid) {
            return res.json({
                code: 403,
                message: '无权操作此请求'
            });
        }

        // 更新请求状态
        friendRequest.status = 'accepted';
        await friendRequest.save();

        // 创建双向好友关系
        const friendship1 = new Friendship({
            userId: friendRequest.fromUserId,
            friendId: friendRequest.toUserId,
            status: 'accepted'
        });

        const friendship2 = new Friendship({
            userId: friendRequest.toUserId,
            friendId: friendRequest.fromUserId,
            status: 'accepted'
        });

        await Promise.all([friendship1.save(), friendship2.save()]);

        // 记录操作
        logUserAction(req, 'ACCEPT_FRIEND_REQUEST', {
            requestId,
            fromUserId: friendRequest.fromUserId,
            toUserId: friendRequest.toUserId
        });

        res.json({
            code: 200,
            message: '已添加为好友'
        });
    } catch (error) {
        logger.error('接受好友请求失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '接受好友请求失败'
        });
    }
});

/**
 * 拒绝好友请求
 * POST /api/friends/reject
 * Body: { requestId }
 */
router.post('/reject', async (req, res) => {
    try {
        const { userid } = req.session;
        const { requestId } = req.body;

        if (!requestId) {
            return res.json({
                code: 400,
                message: '请求ID不能为空'
            });
        }

        // 查找好友请求
        const friendRequest = await FriendRequest.findById(requestId);
        if (!friendRequest) {
            return res.json({
                code: 404,
                message: '好友请求不存在'
            });
        }

        // 验证请求是否属于当前用户
        if (friendRequest.toUserId !== userid) {
            return res.json({
                code: 403,
                message: '无权操作此请求'
            });
        }

        // 更新请求状态
        friendRequest.status = 'rejected';
        await friendRequest.save();

        // 记录操作
        logUserAction(req, 'REJECT_FRIEND_REQUEST', {
            requestId,
            fromUserId: friendRequest.fromUserId,
            toUserId: friendRequest.toUserId
        });

        res.json({
            code: 200,
            message: '已拒绝好友请求'
        });
    } catch (error) {
        logger.error('拒绝好友请求失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '拒绝好友请求失败'
        });
    }
});

/**
 * 获取好友列表
 * GET /api/friends/list
 * Query: { page, limit, sort }
 */
router.get('/list', async (req, res) => {
    try {
        const { userid } = req.session;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const sort = req.query.sort || '-updateTime';

        // 查询好友关系
        const friendships = await Friendship.find({
            userId: userid,
            status: 'accepted'
        })
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(limit);

        const friendIds = friendships.map(f => f.friendId);

        // 获取好友详细信息
        const friends = await User.find({
            _id: { $in: friendIds }
        }).select('_id username createTime');

        // 获取好友设置
        const settings = await UserSettings.find({
            userId: { $in: friendIds }
        });

        const settingsMap = new Map(
            settings.map(s => [s.userId.toString(), s])
        );

        // 组装返回数据
        const result = friends.map(user => {
            const friendship = friendships.find(f => f.friendId.toString() === user._id.toString());
            const userSettings = settingsMap.get(user._id.toString());

            return {
                id: user._id,
                username: user.username,
                remark: friendship?.remark || '',
                joinDate: user.createTime,
                showOnlineStatus: userSettings?.privacy?.showOnlineStatus ?? true
            };
        });

        // 获取总数
        const total = await Friendship.countDocuments({
            userId: userid,
            status: 'accepted'
        });

        res.json({
            code: 200,
            message: 'success',
            data: {
                list: result,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('获取好友列表失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取好友列表失败'
        });
    }
});

/**
 * 获取好友请求列表
 * GET /api/friends/requests
 */
router.get('/requests', async (req, res) => {
    try {
        const { userid } = req.session;

        // 查询待处理的好友请求
        const requests = await FriendRequest.find({
            toUserId: userid,
            status: 'pending'
        })
        .sort('-createTime')
        .limit(20);

        // 获取请求用户信息
        const fromUserIds = requests.map(r => r.fromUserId);
        const users = await User.find({
            _id: { $in: fromUserIds }
        }).select('_id username createTime');

        const userMap = new Map(
            users.map(u => [u._id.toString(), u])
        );

        // 组装返回数据
        const result = requests.map(request => ({
            id: request._id,
            fromUserId: request.fromUserId,
            username: userMap.get(request.fromUserId)?.username || '未知用户',
            message: request.message,
            createTime: request.createTime
        }));

        res.json({
            code: 200,
            message: 'success',
            data: result
        });
    } catch (error) {
        logger.error('获取好友请求列表失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取好友请求列表失败'
        });
    }
});

/**
 * 删除好友
 * DELETE /api/friends/:friendId
 */
router.delete('/:friendId', async (req, res) => {
    try {
        const { userid } = req.session;
        const { friendId } = req.params;

        if (!friendId) {
            return res.json({
                code: 400,
                message: '好友ID不能为空'
            });
        }

        // 删除双向好友关系
        const result = await Friendship.deleteMany({
            $or: [
                { userId: userid, friendId: friendId },
                { userId: friendId, friendId: userid }
            ],
            status: 'accepted'
        });

        if (result.deletedCount === 0) {
            return res.json({
                code: 404,
                message: '好友关系不存在'
            });
        }

        // 记录操作
        logUserAction(req, 'DELETE_FRIEND', {
            userId: userid,
            friendId: friendId
        });

        res.json({
            code: 200,
            message: '已删除好友'
        });
    } catch (error) {
        logger.error('删除好友失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '删除好友失败'
        });
    }
});

/**
 * 屏蔽好友
 * POST /api/friends/:friendId/block
 */
router.post('/:friendId/block', async (req, res) => {
    try {
        const { userid } = req.session;
        const { friendId } = req.params;

        if (!friendId) {
            return res.json({
                code: 400,
                message: '好友ID不能为空'
            });
        }

        // 删除原有好友关系
        await Friendship.deleteMany({
            $or: [
                { userId: userid, friendId: friendId },
                { userId: friendId, friendId: userid }
            ]
        });

        // 创建屏蔽关系
        const blockRelationship = new Friendship({
            userId: userid,
            friendId: friendId,
            status: 'blocked'
        });

        await blockRelationship.save();

        // 记录操作
        logUserAction(req, 'BLOCK_FRIEND', {
            userId: userid,
            friendId: friendId
        });

        res.json({
            code: 200,
            message: '已屏蔽好友'
        });
    } catch (error) {
        logger.error('屏蔽好友失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '屏蔽好友失败'
        });
    }
});

/**
 * 设置好友备注
 * POST /api/friends/remark
 * Body: { friendId, remark }
 */
router.post('/remark', async (req, res) => {
    try {
        const { userid } = req.session;
        const { friendId, remark } = req.body;

        if (!friendId) {
            return res.json({
                code: 400,
                message: '好友ID不能为空'
            });
        }

        // 更新好友关系中的备注
        const friendship = await Friendship.findOneAndUpdate(
            {
                userId: userid,
                friendId: friendId,
                status: 'accepted'
            },
            {
                remark: remark || ''
            },
            {
                new: true
            }
        );

        if (!friendship) {
            return res.json({
                code: 404,
                message: '好友关系不存在'
            });
        }

        // 记录操作
        logUserAction(req, 'SET_FRIEND_REMARK', {
            userId: userid,
            friendId,
            remark
        });

        res.json({
            code: 200,
            message: '备注设置成功'
        });
    } catch (error) {
        logger.error('设置好友备注失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '设置好友备注失败'
        });
    }
});

module.exports = router;
