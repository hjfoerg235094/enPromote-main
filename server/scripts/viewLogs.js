#!/usr/bin/env node

/**
 * 日志查看脚本
 * 使用方法：
 * node scripts/viewLogs.js [选项]
 * 
 * 选项：
 * --type error|access|combined  日志类型 (默认: combined)
 * --lines 100                   显示行数 (默认: 50)
 * --search keyword              搜索关键词
 * --date 2024-01-01            按日期过滤
 * --level ERROR|WARN|INFO      按级别过滤
 * --stats                      显示统计信息
 */

const LogViewer = require('../utils/logViewer');
const path = require('path');

const logViewer = new LogViewer();

// 解析命令行参数
const args = process.argv.slice(2);
const options = {};

for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
        const key = arg.substring(2);
        const value = args[i + 1];
        options[key] = value;
        i++; // 跳过下一个参数
    }
}

// 默认值
const type = options.type || 'combined';
const lines = parseInt(options.lines) || 50;
const search = options.search;
const date = options.date;
const level = options.level;
const showStats = options.stats !== undefined;

console.log('='.repeat(80));
console.log('📊 英语学习系统 - 日志查看器');
console.log('='.repeat(80));

if (showStats) {
    // 显示统计信息
    const stats = logViewer.getLogStats();
    console.log('\n📈 今日日志统计:');
    console.log(`日期: ${stats.date}`);
    console.log(`总计: ${stats.total} 条`);
    console.log(`错误: ${stats.errors} 条`);
    console.log(`警告: ${stats.warnings} 条`);
    console.log(`信息: ${stats.info} 条`);
    console.log('='.repeat(80));
    return;
}

let logs = [];

if (search) {
    // 搜索日志
    console.log(`🔍 搜索关键词: "${search}" (类型: ${type}, 行数: ${lines})`);
    logs = logViewer.searchLogs(search, type, lines);
} else if (date) {
    // 按日期过滤
    console.log(`📅 查看日期: ${date}`);
    logs = logViewer.getLogsByDate(type, date);
} else if (level) {
    // 按级别过滤
    console.log(`🎯 查看级别: ${level}`);
    logs = logViewer.getLogsByLevel(level);
} else {
    // 普通查看
    console.log(`📋 查看日志 (类型: ${type}, 行数: ${lines})`);
    switch (type) {
        case 'error':
            logs = logViewer.getErrorLogs(lines);
            break;
        case 'access':
            logs = logViewer.getAccessLogs(lines);
            break;
        default:
            logs = logViewer.getCombinedLogs(lines);
    }
}

console.log(`\n找到 ${logs.length} 条日志记录:\n`);

if (logs.length === 0) {
    console.log('❌ 没有找到匹配的日志记录');
} else {
    logs.forEach((log, index) => {
        // 为不同级别的日志添加颜色
        let coloredLog = log;
        if (log.includes('[ERROR]')) {
            coloredLog = `\x1b[31m${log}\x1b[0m`; // 红色
        } else if (log.includes('[WARN]')) {
            coloredLog = `\x1b[33m${log}\x1b[0m`; // 黄色
        } else if (log.includes('[INFO]')) {
            coloredLog = `\x1b[32m${log}\x1b[0m`; // 绿色
        }
        
        console.log(`${(index + 1).toString().padStart(3, ' ')}. ${coloredLog}`);
    });
}

console.log('\n' + '='.repeat(80));
console.log('💡 使用提示:');
console.log('  查看错误日志: node scripts/viewLogs.js --type error --lines 20');
console.log('  搜索日志:     node scripts/viewLogs.js --search "登录" --lines 10');
console.log('  查看统计:     node scripts/viewLogs.js --stats');
console.log('  按日期查看:   node scripts/viewLogs.js --date 2024-01-01');
console.log('  按级别查看:   node scripts/viewLogs.js --level ERROR');
console.log('='.repeat(80));
