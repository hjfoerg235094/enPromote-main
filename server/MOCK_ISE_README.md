# 口语评测模拟服务使用指南

## 概述

本项目的口语评测功能支持两种模式：
1. **真实API模式**：使用百度智能云语音评测API进行实际评测
2. **模拟模式**：使用模拟服务进行测试，无需真实的API密钥

## 模拟服务特点

- 无需配置真实的API密钥
- 模拟真实的API响应格式和评分逻辑
- 支持所有评测类型（单词、句子、段落、自由说）
- 支持所有评测等级（小学、初中、高中、大学）
- 提供详细的评分维度（准确度、流利度、完整度、发音、语速、语调）
- 包含单词和音素级别的详细评分
- 生成智能化的评测建议

## 如何使用模拟模式

### 方法1：通过环境变量

在 `server/.env` 文件中添加：

```bash
USE_MOCK_ISE=true
```

### 方法2：启动时指定环境变量

```bash
# Windows
set USE_MOCK_ISE=true && node server/app.js

# Linux/Mac
USE_MOCK_ISE=true node server/app.js
```

### 方法3：在package.json中配置

在 `server/package.json` 的scripts中添加：

```json
{
  "scripts": {
    "start:mock": "cross-env USE_MOCK_ISE=true node app.js",
    "start:real": "cross-env USE_MOCK_ISE=false node app.js"
  }
}
```

然后使用：
```bash
npm run start:mock  # 使用模拟模式
npm run start:real  # 使用真实API
```

## API接口

模拟服务提供与真实API完全相同的接口：

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
    "overallScore": 85,
    "dimensions": {
      "accuracy": 88,
      "fluency": 82,
      "integrity": 86,
      "pronunciation": 84,
      "speed": 80,
      "intonation": 83
    },
    "details": {
      "words": [
        {
          "word": "hello",
          "score": 90,
          "startTime": 0,
          "endTime": 500
        }
      ],
      "phonemes": [
        {
          "phoneme": "h",
          "score": 95,
          "startTime": 0,
          "endTime": 100
        }
      ]
    },
    "advice": {
      "overall": "发音良好，还有提升空间",
      "accuracy": "发音准确度很好",
      "fluency": "流利度很好，语速适中",
      "integrity": "朗读完整，没有遗漏",
      "pronunciation": "发音标准，语音语调自然",
      "speed": "语速适中，表达流畅",
      "intonation": "语调自然，抑扬顿挫"
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
      "overallScore": 85,
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

## 模拟评分逻辑

模拟服务的评分基于以下逻辑：

1. **总体评分**：基于所有单词评分的平均值
2. **准确度**：随机生成70-95分
3. **流利度**：随机生成70-95分
4. **完整度**：随机生成80-98分
5. **发音**：随机生成70-95分
6. **语速**：基于单词数量和时长计算
7. **语调**：基于单词评分和句子结构计算

## 评测建议生成

模拟服务会根据评分自动生成相应的建议：

- **90分以上**：优秀，继续保持
- **80-89分**：良好，还有提升空间
- **60-79分**：基本正确，需要加强练习
- **60分以下**：需要改进，请多听多练

## 注意事项

1. 模拟服务仅用于开发和测试，不能用于生产环境
2. 模拟评分是随机生成的，不代表真实的发音水平
3. 切换模式时需要重启服务器
4. 确保在测试环境中使用模拟模式，避免影响生产数据

## 故障排除

### 问题：切换模式后没有生效

**解决方案：**
- 确认环境变量 `USE_MOCK_ISE` 已正确设置
- 重启服务器使配置生效
- 检查服务器日志中的模式提示信息

### 问题：模拟服务返回错误

**解决方案：**
- 检查音频文件格式是否正确
- 确认音频文件大小不超过10MB
- 查看服务器日志获取详细错误信息

## 技术支持

如有问题，请查看项目文档或联系技术支持。
