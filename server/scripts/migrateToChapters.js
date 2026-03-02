const mongoose = require('mongoose');
const User = require('../modules/User');

// 数据库连接配置
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/english_learning';

async function migrateUsersToChapters() {
  try {
    // 连接数据库
    await mongoose.connect(MONGODB_URI);
    console.log('已连接到数据库');

    // 查找所有用户
    const users = await User.find({});
    console.log(`找到 ${users.length} 个用户需要迁移`);

    let migratedCount = 0;

    for (const user of users) {
      // 检查用户是否已经有chapters字段
      if (!user.chapters || user.chapters.size === 0) {
        // 基于现有的cet4进度创建章节数据
        const currentProgress = user.cet4 || {};
        
        user.chapters = new Map([
          ['A', {
            level: 1,
            score: 0,
            completedWords: 0,
            wordP: currentProgress.wordP || false,
            spellP: currentProgress.spellP || false,
            listenP: currentProgress.listenP || false,
            customsP: currentProgress.customsP || false,
            coverP: currentProgress.coverP || false
          }],
          ['B', {
            level: 1,
            score: 0,
            completedWords: 0,
            wordP: false,
            spellP: false,
            listenP: false,
            customsP: false,
            coverP: false
          }]
        ]);

        // 设置当前章节
        user.currentChapter = user.currentChapter || 'A';

        await user.save();
        migratedCount++;
        console.log(`已迁移用户: ${user.username}`);
      } else {
        console.log(`用户 ${user.username} 已有章节数据，跳过`);
      }
    }

    console.log(`迁移完成！共迁移了 ${migratedCount} 个用户`);

  } catch (error) {
    console.error('迁移过程中出错:', error);
  } finally {
    // 关闭数据库连接
    await mongoose.disconnect();
    console.log('已断开数据库连接');
  }
}

// 运行迁移
if (require.main === module) {
  migrateUsersToChapters();
}

module.exports = migrateUsersToChapters;