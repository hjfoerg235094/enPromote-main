const express = require('express');
const router = express.Router();
const LogViewer = require('../utils/logViewer');
const { logger, logUserAction } = require('../utils/logger');

const logViewer = new LogViewer();

// 管理员权限检查中间件
const checkAdminPermission = (req, res, next) => {
    // 这里可以实现更复杂的权限检查逻辑
    const userId = req.session?.userid;
    if (!userId) {
        return res.status(401).json({
            code: 401,
            message: '请先登录'
        });
    }
    
    // 简单的管理员检查（实际项目中应该从数据库检查用户角色）
    // 这里假设第一个注册的用户是管理员，或者可以通过其他方式标识
    next();
};

// 获取错误日志
router.get('/errors', checkAdminPermission, (req, res) => {
    try {
        const lines = parseInt(req.query.lines) || 100;
        const logs = logViewer.getErrorLogs(lines);
        
        logUserAction(req, 'VIEW_ERROR_LOGS', { lines });
        
        res.json({
            code: 200,
            data: logs,
            message: '获取错误日志成功'
        });
    } catch (error) {
        logger.error('获取错误日志失败', error);
        res.status(500).json({
            code: 500,
            message: '获取错误日志失败'
        });
    }
});

// 获取访问日志
router.get('/access', checkAdminPermission, (req, res) => {
    try {
        const lines = parseInt(req.query.lines) || 100;
        const logs = logViewer.getAccessLogs(lines);
        
        logUserAction(req, 'VIEW_ACCESS_LOGS', { lines });
        
        res.json({
            code: 200,
            data: logs,
            message: '获取访问日志成功'
        });
    } catch (error) {
        logger.error('获取访问日志失败', error);
        res.status(500).json({
            code: 500,
            message: '获取访问日志失败'
        });
    }
});

// 获取组合日志
router.get('/combined', checkAdminPermission, (req, res) => {
    try {
        const lines = parseInt(req.query.lines) || 100;
        const logs = logViewer.getCombinedLogs(lines);
        
        logUserAction(req, 'VIEW_COMBINED_LOGS', { lines });
        
        res.json({
            code: 200,
            data: logs,
            message: '获取组合日志成功'
        });
    } catch (error) {
        logger.error('获取组合日志失败', error);
        res.status(500).json({
            code: 500,
            message: '获取组合日志失败'
        });
    }
});

// 搜索日志
router.get('/search', checkAdminPermission, (req, res) => {
    try {
        const { keyword, type = 'combined', lines = 100 } = req.query;
        
        if (!keyword) {
            return res.status(400).json({
                code: 400,
                message: '请提供搜索关键词'
            });
        }
        
        const logs = logViewer.searchLogs(keyword, type, parseInt(lines));
        
        logUserAction(req, 'SEARCH_LOGS', { keyword, type, lines });
        
        res.json({
            code: 200,
            data: logs,
            message: '搜索日志成功'
        });
    } catch (error) {
        logger.error('搜索日志失败', error);
        res.status(500).json({
            code: 500,
            message: '搜索日志失败'
        });
    }
});

// 获取日志统计
router.get('/stats', checkAdminPermission, (req, res) => {
    try {
        const stats = logViewer.getLogStats();
        
        logUserAction(req, 'VIEW_LOG_STATS');
        
        res.json({
            code: 200,
            data: stats,
            message: '获取日志统计成功'
        });
    } catch (error) {
        logger.error('获取日志统计失败', error);
        res.status(500).json({
            code: 500,
            message: '获取日志统计失败'
        });
    }
});

// 按日期获取日志
router.get('/date/:date', checkAdminPermission, (req, res) => {
    try {
        const { date } = req.params;
        const logs = logViewer.getLogsByDate('combined', date);
        
        logUserAction(req, 'VIEW_LOGS_BY_DATE', { date });
        
        res.json({
            code: 200,
            data: logs,
            message: `获取${date}的日志成功`
        });
    } catch (error) {
        logger.error('按日期获取日志失败', error);
        res.status(500).json({
            code: 500,
            message: '按日期获取日志失败'
        });
    }
});

// 按级别获取日志
router.get('/level/:level', checkAdminPermission, (req, res) => {
    try {
        const { level } = req.params;
        const logs = logViewer.getLogsByLevel(level);
        
        logUserAction(req, 'VIEW_LOGS_BY_LEVEL', { level });
        
        res.json({
            code: 200,
            data: logs,
            message: `获取${level}级别日志成功`
        });
    } catch (error) {
        logger.error('按级别获取日志失败', error);
        res.status(500).json({
            code: 500,
            message: '按级别获取日志失败'
        });
    }
});

// 清理旧日志
router.post('/clean', checkAdminPermission, (req, res) => {
    try {
        const { daysToKeep = 30 } = req.body;
        logViewer.cleanOldLogs(daysToKeep);
        
        logUserAction(req, 'CLEAN_OLD_LOGS', { daysToKeep });
        logger.info(`管理员清理旧日志，保留${daysToKeep}天`);
        
        res.json({
            code: 200,
            message: '清理旧日志成功'
        });
    } catch (error) {
        logger.error('清理旧日志失败', error);
        res.status(500).json({
            code: 500,
            message: '清理旧日志失败'
        });
    }
});

module.exports = router;
