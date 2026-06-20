# 💝 恋爱人格代码 — Love Personality Code

基于**恋爱认知-行为四维模型**（D 依恋安全感 / S 情绪共振力 / E 关系决策力 / O 开放性）的在线人格测试。

15 道情景题 → 14 种人格类型 → 4 轴雷达图。

## 🏗 项目结构

```
love-test/
├── index.html          # 前端测试页面
├── api/
│   ├── submit.js       # 云函数：接收测试结果 → 存入 Supabase（零 npm 依赖）
│   └── results.js      # 云函数：管理后台查询（零 npm 依赖）
├── vercel.json         # Vercel 部署配置
├── setup.sql           # Supabase 建表 SQL
├── .env.example        # 环境变量模板
├── .gitignore          # 不提交 .env 等敏感文件
└── README.md           # 本文件
```

## 🚀 部署步骤

### 1. 创建 Supabase 数据库（免费）

1. 打开 [supabase.com](https://supabase.com) → Sign Up 注册
2. 创建新项目 → 记下数据库密码
3. 进入项目 → **SQL Editor** → 粘贴 `setup.sql` 全部内容 → 点 **Run**
4. 进入 **Settings → API** → 复制：
   - `Project URL`（例如 `https://xxxxx.supabase.co`）
   - `anon public key`（以 `eyJ...` 开头）

### 2. 部署到 Vercel

1. 把 `love-test` 文件夹推送到 GitHub 仓库
2. 打开 [vercel.com](https://vercel.com) → Import 导入该仓库
3. 在 **Environment Variables** 中添加：

| 变量名 | 值 |
|---|---|
| `SUPABASE_URL` | 你的 Supabase Project URL |
| `SUPABASE_ANON_KEY` | 你的 Supabase anon key |
| `ADMIN_PASSWORD` | 你自己设置的管理密码 |

4. 点击 **Deploy** → 等待完成 → 获得域名（如 `https://love-test.vercel.app`）

### 3. 使用管理后台

1. 打开你的域名
2. 点击页面底部的 **📊 管理后台**
3. 输入 `ADMIN_PASSWORD` 中设置的密码
4. 可以：
   - 查看所有测试者昵称、四维得分、人格类型
   - 点击 **📋 查看答题** 展开每道题的选项详情
   - 导出 CSV

## 📊 数据说明

- 数据存储在 **Supabase PostgreSQL** 数据库中
- 每条记录包含：昵称、四维得分、人格类型、**15 道题的完整选项**
- 数据在云端持久保存，不受浏览器清除缓存影响
- IP 仅存储 SHA256 哈希前 16 位用于频率限制，不追踪精确位置

## 🔒 安全

- `.env` 文件已加入 `.gitignore`，不会提交到 Git
- Supabase 密钥只存在于 Vercel 服务器端环境变量中
- 管理后台通过 `ADMIN_PASSWORD` 验证，密码在服务端校验
- 用户提交频率限制：每 IP 每 10 秒最多 3 次
