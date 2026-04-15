
const express = require('express');
const router = express.Router();
const ChatMessage = require('../modules/ChatMessage');
const ChatConversation = require('../modules/ChatConversation');
const User = require('../modules/User');
const Friendship = require('../modules/Friendship');
const { logger, logApiError, logUserAction } = require('../utils/logger');

/**
 * 获取与指定好友的聊天记录
 * GET /api/chat/messages/:friendId
 * Query: { page, limit }
 */
router.get('/messages/:friendId', async (req, res) => {
    try {
        const { userid } = req.session;
        const { friendId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;

        // 验证是否为好友关系
        const friendship = await Friendship.findOne({
            userId: userid,
            friendId: friendId,
            status: 'accepted'
        });

        if (!friendship) {
            return res.json({
                code: 403,
                message: '只能与好友聊天'
            });
        }

        // 获取聊天记录，并关联发送者信息
        const messages = await ChatMessage.find({
            $or: [
                { fromUserId: userid, toUserId: friendId },
                { fromUserId: friendId, toUserId: userid }
            ]
        })
        .populate('fromUserId', 'username avatar')
        .populate('toUserId', 'username avatar')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(limit);

        // 获取总数
        const total = await ChatMessage.countDocuments({
            $or: [
                { fromUserId: userid, toUserId: friendId },
                { fromUserId: friendId, toUserId: userid }
            ]
        });

        // 将收到的消息标记为已读
        await ChatMessage.updateMany(
            {
                fromUserId: friendId,
                toUserId: userid,
                isRead: false
            },
            {
                isRead: true,
                readAt: new Date()
            }
        );

        // 更新会话未读数
        const conversation = await ChatConversation.findOne({
            participants: { $all: [userid, friendId] }
        });
        if (conversation) {
            conversation.unreadCount.set(userid, 0);
            await conversation.save();
        }

        res.json({
            code: 200,
            message: 'success',
            data: {
                messages: messages.reverse(),
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        logger.error('获取聊天记录失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取聊天记录失败'
        });
    }
});

/**
 * 发送消息
 * POST /api/chat/send
 * Body: { toUserId, content, messageType }
 */
router.post('/send', async (req, res) => {
    try {
        const { userid } = req.session;
        const { toUserId, content, messageType = 'text' } = req.body;

        if (!toUserId) {
            return res.json({
                code: 400,
                message: '接收者ID不能为空'
            });
        }

        if (!content || content.trim() === '') {
            return res.json({
                code: 400,
                message: '消息内容不能为空'
            });
        }

        // 验证是否为好友关系
        const friendship = await Friendship.findOne({
            userId: userid,
            friendId: toUserId,
            status: 'accepted'
        });

        if (!friendship) {
            return res.json({
                code: 403,
                message: '只能向好友发送消息'
            });
        }

        // 创建消息
        const message = new ChatMessage({
            fromUserId: userid,
            toUserId: toUserId,
            content: content.trim(),
            messageType
        });

        await message.save();

        // 查找或创建会话
        let conversation = await ChatConversation.findOne({
            participants: { $all: [userid, toUserId] }
        });

        if (!conversation) {
            conversation = new ChatConversation({
                participants: [userid, toUserId]
            });
        }

        // 更新会话信息
        conversation.lastMessage = message._id;
        conversation.lastMessageTime = message.createdAt;

        // 更新接收方的未读数
        const currentUnread = conversation.unreadCount.get(toUserId) || 0;
        conversation.unreadCount.set(toUserId, currentUnread + 1);

        await conversation.save();

        // 记录操作
        logUserAction(req, 'SEND_CHAT_MESSAGE', {
            fromUserId: userid,
            toUserId: toUserId
        });

        res.json({
            code: 200,
            message: '消息发送成功',
            data: {
                messageId: message._id,
                createdAt: message.createdAt
            }
        });
    } catch (error) {
        logger.error('发送消息失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '发送消息失败'
        });
    }
});

/**
 * 获取会话列表
 * GET /api/chat/conversations
 */
router.get('/conversations', async (req, res) => {
    try {
        const { userid } = req.session;

        // 获取用户参与的所有会话
        const conversations = await ChatConversation.find({
            participants: userid
        })
        .sort('-lastMessageTime')
        .populate('lastMessage')
        .populate('participants', 'username');

        // 获取每个会话的好友信息
        const result = await Promise.all(conversations.map(async (conv) => {
            // 找出会话中的另一个用户（好友）
            const friendId = conv.participants.find(p => p._id.toString() !== userid);

            // 获取好友关系信息
            const friendship = await Friendship.findOne({
                userId: userid,
                friendId: friendId._id,
                status: 'accepted'
            });

            return {
                conversationId: conv._id,
                friendId: friendId._id,
                username: friendId.username,
                remark: friendship?.remark || '',
                lastMessage: conv.lastMessage,
                lastMessageTime: conv.lastMessageTime,
                unreadCount: conv.unreadCount.get(userid) || 0
            };
        }));

        res.json({
            code: 200,
            message: 'success',
            data: result
        });
    } catch (error) {
        logger.error('获取会话列表失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '获取会话列表失败'
        });
    }
});

/**
 * 标记消息为已读
 * POST /api/chat/read/:conversationId
 */
router.post('/read/:conversationId', async (req, res) => {
    try {
        const { userid } = req.session;
        const { conversationId } = req.params;

        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) {
            return res.json({
                code: 404,
                message: '会话不存在'
            });
        }

        // 验证用户是否参与该会话
        if (!conversation.participants.includes(userid)) {
            return res.json({
                code: 403,
                message: '无权操作此会话'
            });
        }

        // 标记消息为已读
        await conversation.markAsRead(userid);

        res.json({
            code: 200,
            message: '已标记为已读'
        });
    } catch (error) {
        logger.error('标记已读失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '标记已读失败'
        });
    }
});

/**
 * 删除会话
 * DELETE /api/chat/conversation/:conversationId
 */
router.delete('/conversation/:conversationId', async (req, res) => {
    try {
        const { userid } = req.session;
        const { conversationId } = req.params;

        const conversation = await ChatConversation.findById(conversationId);
        if (!conversation) {
            return res.json({
                code: 404,
                message: '会话不存在'
            });
        }

        // 验证用户是否参与该会话
        if (!conversation.participants.includes(userid)) {
            return res.json({
                code: 403,
                message: '无权操作此会话'
            });
        }

        // 删除会话（但不删除消息记录）
        await ChatConversation.findByIdAndDelete(conversationId);

        // 记录操作
        logUserAction(req, 'DELETE_CONVERSATION', {
            conversationId,
            userId: userid
        });

        res.json({
            code: 200,
            message: '会话已删除'
        });
    } catch (error) {
        logger.error('删除会话失败:', error);
        logApiError(req, error, 500);
        res.json({
            code: 500,
            message: '删除会话失败'
        });
    }
});

module.exports = router;
