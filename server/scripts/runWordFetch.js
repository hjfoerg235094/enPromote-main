const { main: fetchCET6Main } = require('./fetchCET6Words');
const { main: fetchPEEMain } = require('./fetchPEEWords');

/**
 * 主函数：运行所有词汇获取脚本
 */
async function main() {
    console.log('开始获取词汇数据...');

    try {
        // 获取CET-6词汇
        console.log('\n=== 获取CET-6词汇 ===');
        await fetchCET6Main();

        // 获取PEE词汇
        console.log('\n=== 获取PEE词汇 ===');
        await fetchPEEMain();

        console.log('\n所有词汇数据获取完成！');
    } catch (error) {
        console.error('获取词汇数据时出错:', error);
    }
}

// 如果直接运行此脚本，则执行主函数
if (require.main === module) {
    main();
}

module.exports = { main };
