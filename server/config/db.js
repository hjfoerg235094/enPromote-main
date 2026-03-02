const mongoose = require('mongoose');
const { dbUrl } = require('./serve');
module.exports = function (success) {
    mongoose.connect(dbUrl);
    mongoose.connection.once('open', () => {
        console.log('数据库连接成功');
        success();
    });
    mongoose.connection.on('error', () => {
        console.log('数据库连接失败');
    });
    mongoose.connection.on('close', () => {
        console.log('数据库连接关闭');
    });
    mongoose.connection.on('disconnected', () => {
        console.log('数据库连接断开');
    });
}