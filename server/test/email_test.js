const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.qq.com',
    port: 465, // SMTP端口，465通常用于SSL
    secure: true, // 对于465端口使用SSL
    auth: {
        user: '1134523750@qq.com', // 你的邮箱地址
        pass: 'evnxriryfgnggdgc' // SMTP授权码
    }
});

// 邮件内容配置
const mailOptions = {
    from: '"enMaster"<1134523750@qq.com>', // 发件人
    to: '1134523750@qq.com', // 收件人，多个收件人用逗号分隔
    subject: '测试邮件', // 邮件主题
    text: '666', // 纯文本内容
    html: '<h1>标题</h1><p>内容</p>'
};

// 发送邮件
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log('发送失败:', error);
    }
    console.log('邮件发送成功，消息ID:', info.messageId);
    console.log('已接受:', info.accepted);
});
