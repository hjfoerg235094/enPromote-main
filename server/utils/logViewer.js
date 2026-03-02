const fs = require('fs');
const path = require('path');

class LogViewer {
    constructor() {
        this.logsDir = path.join(__dirname, '../logs');
    }

    // 读取错误日志
    getErrorLogs(lines = 100) {
        try {
            const errorLogPath = path.join(this.logsDir, 'error.log');
            if (!fs.existsSync(errorLogPath)) {
                return [];
            }
            
            const content = fs.readFileSync(errorLogPath, 'utf-8');
            const logLines = content.split('\n').filter(line => line.trim());
            return logLines.slice(-lines);
        } catch (error) {
            console.error('读取错误日志失败:', error);
            return [];
        }
    }

    // 读取访问日志
    getAccessLogs(lines = 100) {
        try {
            const accessLogPath = path.join(this.logsDir, 'access.log');
            if (!fs.existsSync(accessLogPath)) {
                return [];
            }
            
            const content = fs.readFileSync(accessLogPath, 'utf-8');
            const logLines = content.split('\n').filter(line => line.trim());
            return logLines.slice(-lines);
        } catch (error) {
            console.error('读取访问日志失败:', error);
            return [];
        }
    }

    // 读取组合日志
    getCombinedLogs(lines = 100) {
        try {
            const combinedLogPath = path.join(this.logsDir, 'combined.log');
            if (!fs.existsSync(combinedLogPath)) {
                return [];
            }
            
            const content = fs.readFileSync(combinedLogPath, 'utf-8');
            const logLines = content.split('\n').filter(line => line.trim());
            return logLines.slice(-lines);
        } catch (error) {
            console.error('读取组合日志失败:', error);
            return [];
        }
    }

    // 按日期过滤日志
    getLogsByDate(logType = 'combined', date = null) {
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            const logs = this.getCombinedLogs(1000);
            
            return logs.filter(log => log.includes(targetDate));
        } catch (error) {
            console.error('按日期过滤日志失败:', error);
            return [];
        }
    }

    // 按级别过滤日志
    getLogsByLevel(level = 'ERROR') {
        try {
            const logs = this.getCombinedLogs(1000);
            return logs.filter(log => log.includes(`[${level.toUpperCase()}]`));
        } catch (error) {
            console.error('按级别过滤日志失败:', error);
            return [];
        }
    }

    // 搜索日志
    searchLogs(keyword, logType = 'combined', lines = 100) {
        try {
            let logs;
            switch (logType) {
                case 'error':
                    logs = this.getErrorLogs(lines);
                    break;
                case 'access':
                    logs = this.getAccessLogs(lines);
                    break;
                default:
                    logs = this.getCombinedLogs(lines);
            }
            
            return logs.filter(log => 
                log.toLowerCase().includes(keyword.toLowerCase())
            );
        } catch (error) {
            console.error('搜索日志失败:', error);
            return [];
        }
    }

    // 获取日志统计信息
    getLogStats() {
        try {
            const today = new Date().toISOString().split('T')[0];
            const todayLogs = this.getLogsByDate('combined', today);
            
            const stats = {
                total: todayLogs.length,
                errors: todayLogs.filter(log => log.includes('[ERROR]')).length,
                warnings: todayLogs.filter(log => log.includes('[WARN]')).length,
                info: todayLogs.filter(log => log.includes('[INFO]')).length,
                date: today
            };
            
            return stats;
        } catch (error) {
            console.error('获取日志统计失败:', error);
            return {
                total: 0,
                errors: 0,
                warnings: 0,
                info: 0,
                date: new Date().toISOString().split('T')[0]
            };
        }
    }

    // 清理旧日志（保留最近N天）
    cleanOldLogs(daysToKeep = 30) {
        try {
            const files = ['error.log', 'access.log', 'combined.log'];
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            files.forEach(filename => {
                const filepath = path.join(this.logsDir, filename);
                if (fs.existsSync(filepath)) {
                    const stats = fs.statSync(filepath);
                    if (stats.mtime < cutoffDate) {
                        // 这里可以实现更复杂的日志轮转逻辑
                        console.log(`日志文件 ${filename} 需要清理`);
                    }
                }
            });
        } catch (error) {
            console.error('清理旧日志失败:', error);
        }
    }
}

module.exports = LogViewer;
