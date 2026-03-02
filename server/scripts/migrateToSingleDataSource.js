const mongoose = require('mongoose');
const User = require('../modules/User');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/english_learning', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function migrateUserData() {
    try {
        console.log('开始数据迁移：移除cet4中的冗余关卡字段...');
        
        const users = await User.find({});
        console.log(`找到 ${users.length} 个用户需要迁移`);
        
        for (const user of users) {
            let needUpdate = false;
            
            // 如果用户的cet4中还有关卡状态字段，需要迁移到chapters
            if (user.cet4.wordP !== undefined || user.cet4.spellP !== undefined) {
                console.log(`迁移用户: ${user.username}`);
                
                // 确保用户有chapters字段
                if (!user.chapters || user.chapters.size === 0) {
                    user.chapters = new Map([
                        ['A', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }],
                        ['B', { level: 1, score: 0, completedWords: 0, wordP: false, spellP: false, listenP: false, customsP: false, coverP: false }]
                    ]);
                    user.currentChapter = user.currentChapter || 'A';
                    needUpdate = true;
                }
                
                // 将cet4中的关卡状态迁移到当前章节
                const currentChapter = user.currentChapter || 'A';
                const chapterProgress = user.chapters.get(currentChapter) || {};
                
                // 迁移关卡状态
                if (user.cet4.wordP !== undefined) {
                    chapterProgress.wordP = user.cet4.wordP;
                    needUpdate = true;
                }
                if (user.cet4.spellP !== undefined) {
                    chapterProgress.spellP = user.cet4.spellP;
                    needUpdate = true;
                }
                if (user.cet4.listenP !== undefined) {
                    chapterProgress.listenP = user.cet4.listenP;
                    needUpdate = true;
                }
                if (user.cet4.customsP !== undefined) {
                    chapterProgress.customsP = user.cet4.customsP;
                    needUpdate = true;
                }
                if (user.cet4.coverP !== undefined) {
                    chapterProgress.coverP = user.cet4.coverP;
                    needUpdate = true;
                }
                
                user.chapters.set(currentChapter, chapterProgress);
                
                // 清除cet4中的冗余字段
                user.cet4.wordP = undefined;
                user.cet4.spellP = undefined;
                user.cet4.listenP = undefined;
                user.cet4.customsP = undefined;
                user.cet4.coverP = undefined;
                
                console.log(`  - 迁移章节 ${currentChapter} 的关卡状态`);
                console.log(`  - wordP: ${chapterProgress.wordP}, spellP: ${chapterProgress.spellP}, listenP: ${chapterProgress.listenP}, customsP: ${chapterProgress.customsP}, coverP: ${chapterProgress.coverP}`);
            }
            
            if (needUpdate) {
                await user.save();
                console.log(`  ✅ 用户 ${user.username} 迁移完成`);
            }
        }
        
        console.log('✅ 数据迁移完成！');
        console.log('现在所有关卡状态都统一存储在 chapters 字段中');
        
    } catch (error) {
        console.error('❌ 数据迁移失败:', error);
    } finally {
        mongoose.connection.close();
    }
}

// 运行迁移
migrateUserData();