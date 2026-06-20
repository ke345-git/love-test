# 💝 恋爱人格代码 v3.0 — Love Personality Code

基于**恋爱认知-行为四维模型**（D 依恋安全感 / S 情绪共振力 / E 关系决策力 / O 开放性），集成 AI 心理学专家对话的在线人格测试。

**4 种探索模式**：标准测试 | AI 专家对话 | 随机题目 | 人格画廊

## 技术栈

| 层 | 技术 | 费用 |
|---|---|---|
| 前端 | 单文件 HTML/CSS/JS SPA | 免费 |
| AI 对话 | DeepSeek V4 Flash（通过 Cloudflare Function 代理） | ¥1/百万 Token |
| AI 语音 | 小米 MiMo-V2.5-TTS | 限时免费 |
| 数据库 | Supabase PostgreSQL | 免费 |
| 托管 | Cloudflare Pages | 免费 |
| 域名 | lanlove.online | 自购 |

## 项目结构

```
love-test/
├── index.html              # 全部前端（SPA）
├── functions/
│   ├── _middleware.js      # CORS + 速率限制
│   └── api/
│       ├── chat.js         # DeepSeek AI 对话代理
│       └── tts.js          # MiMo-TTS 语音合成代理
├── assets/avatars/         # 心理学家 SVG 头像
│   ├── nuwa.svg
│   ├── jung.svg
│   ├── fromm.svg
│   └── satir.svg
├── setup.sql               # Supabase 数据库建表
├── .gitignore
└── README.md
```

## 心理学家

| 专家 | 理论取向 | 风格 |
|------|---------|------|
| 女娲 🧘 | 依恋理论 + 客体关系 | 温柔包容的治愈者 |
| 荣格博士 🧔 | 分析心理学 | 深邃的智慧老人 |
| 弗洛姆教授 📚 | 人本精神分析 | 理性的温暖声音 |
| 萨提尔 🌸 | 家庭治疗 | 温暖的接纳者 |

## 部署

### 前置条件

1. **DeepSeek API Key**：注册 [platform.deepseek.com](https://platform.deepseek.com) → 实名认证 → 创建 API Key
2. **MiMo-TTS API Key**（可选）：语音合成需要
3. **Supabase** 数据库已配置
4. **Cloudflare** 账号 + 域名

### Cloudflare Pages 环境变量

在 Cloudflare Pages → Settings → Environment Variables 中添加：

| 变量名 | 值 |
|---|---|
| `DEEPSEEK_API_KEY` | `sk-xxx` |
| `MIMO_API_KEY` | MiMo API Key（可选，没有则 TTS 自动降级） |
| `SUPABASE_URL` | 已配置（在 index.html 中） |
| `SUPABASE_ANON_KEY` | 已配置（在 index.html 中） |

### 部署步骤

1. 推送代码到 GitHub
2. Cloudflare Pages 连接仓库 → 自动部署
3. 添加环境变量 → 重新部署
4. 自定义域名绑定 `lanlove.online`

## 数据库

在 Supabase SQL Editor 中运行 `setup.sql` 创建表：
- `test_results` — 标准测试结果
- `chat_sessions` — AI 对话记录

## 管理后台

页面底部 **📊 管理后台** → 输入密码查看所有测试和对话数据。
