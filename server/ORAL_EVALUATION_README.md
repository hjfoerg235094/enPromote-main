
# 口语评测模块使用指南

## 功能概述

本模块基于科大讯飞免费版口语评测 API，提供对用户发音的多维度评分功能，包括准确率、流利度、完整度和发音评分。

## 配置说明

### 1. 获取科大讯飞 API 密钥

1. 访问 [科大讯飞开放平台](https://www.xfyun.cn/)
2. 注册账号并登录
3. 创建新应用，选择"语音评测"服务
4. 获取以下信息：
   - APPID
   - API Key
   - API Secret

### 2. 配置环境变量

在 `server/.env` 文件中添加以下配置：

```bash
XUNFEI_APP_ID=your_app_id_here
XUNFEI_API_KEY=your_api_key_here
XUNFEI_API_SECRET=your_api_secret_here
```

## API 接口说明

### 1. 单次口语评测

**接口地址：** `POST /api/oral/evaluate`

**请求参数：**
- `audio`: 音频文件 (form-data，必填)
- `text`: 待评测文本 (必填)
- `category`: 评测类型 (可选，默认为 sentence)
  - `word`: 单词评测
  - `sentence`: 句子评测
  - `paragraph`: 段落评测
  - `free`: 自由说
- `level`: 评测等级 (可选，默认为 senior)
  - `primary`: 小学
  - `junior`: 初中
  - `senior`: 高中
  - `college`: 大学

**返回结果：**
```json
{
  "success": true,
  "data": {
    "overallScore": 85.5,
    "dimensions": {
      "accuracy": 88.2,
      "fluency": 82.3,
      "integrity": 86.7,
      "pronunciation": 84.9
    },
    "details": {
      "words": [...],
      "phonemes": [...]
    },
    "advice": {
      "overall": "发音良好，还有提升空间",
      "accuracy": "注意一些单词的发音细节",
      "fluency": "注意语速和停顿",
      "integrity": "注意不要遗漏单词",
      "pronunciation": "注意语音语调的准确性"
    }
  }
}
```

### 2. 批量口语评测

**接口地址：** `POST /api/oral/batch-evaluate`

**请求参数：**
- `audio`: 音频文件 (form-data，必填)
- `texts`: 待评测文本数组 (必填)
- `category`: 评测类型 (可选)
- `level`: 评测等级 (可选)

**返回结果：**
```json
{
  "success": true,
  "data": [
    {
      "overallScore": 85.5,
      "dimensions": {...},
      "details": {...},
      "advice": {...}
    },
    ...
  ]
}
```

### 3. 获取评测配置

**接口地址：** `GET /api/oral/config`

**返回结果：**
```json
{
  "success": true,
  "data": {
    "categories": {
      "word": "单词评测",
      "sentence": "句子评测",
      "paragraph": "段落评测",
      "free": "自由说"
    },
    "levels": {
      "primary": "小学",
      "junior": "初中",
      "senior": "高中",
      "college": "大学"
    }
  }
}
```

## 评分维度说明

1. **准确度 (Accuracy)**: 评估发音的准确性，包括音素和单词的发音是否标准
2. **流利度 (Fluency)**: 评估说话的流畅程度，包括语速、停顿等
3. **完整度 (Integrity)**: 评估朗读的完整性，是否有遗漏或重复
4. **发音 (Pronunciation)**: 评估整体发音质量，包括语音语调等

## 使用示例

### JavaScript 示例

```javascript
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('text', 'Hello, how are you?');
formData.append('category', 'sentence');
formData.append('level', 'senior');

fetch('/api/oral/evaluate', {
  method: 'POST',
  body: formData
})
  .then(response => response.json())
  .then(data => {
    console.log('评测结果:', data.data);
  });
```

### cURL 示例

```bash
curl -X POST http://localhost:3000/api/oral/evaluate \
  -F "audio=@test.wav" \
  -F "text=Hello, how are you?" \
  -F "category=sentence" \
  -F "level=senior"
```

## 注意事项

1. 音频文件格式要求：
   - 支持格式：WAV、MP3 等
   - 采样率：建议 16kHz
   - 编码：建议使用 PCM 编码
   - 大小限制：最大 10MB

2. 文本要求：
   - 英文文本
   - 长度根据评测类型有所不同
   - 单词评测：单个单词
   - 句子评测：建议不超过 200 字符
   - 段落评测：建议不超过 500 字符

3. 评分说明：
   - 总分范围：0-100
   - 各维度评分范围：0-100
   - 评分越高表示表现越好

## 故障排除

### 问题：评测失败，返回"评测失败"错误

**可能原因：**
1. API 密钥配置错误
2. 音频文件格式不支持
3. 网络连接问题

**解决方案：**
1. 检查 .env 文件中的 API 密钥是否正确
2. 确认音频文件格式符合要求
3. 检查服务器网络连接

### 问题：评分结果不准确

**可能原因：**
1. 音频质量不佳
2. 环境噪音干扰
3. 评测等级选择不当

**解决方案：**
1. 使用高质量的录音设备
2. 在安静环境下录音
3. 根据实际水平选择合适的评测等级

## 技术支持

如有问题，请联系技术支持或查看科大讯飞官方文档：
https://www.xfyun.cn/doc/ISE/ISEAPI.html
