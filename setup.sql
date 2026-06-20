-- =============================================================
-- 恋爱人格测试 - Supabase 数据库建表 SQL
-- 在 Supabase 项目 → SQL Editor → 粘贴执行
-- =============================================================

-- 1. 创建测试结果表（核心数据表）
CREATE TABLE IF NOT EXISTS results (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nickname      TEXT NOT NULL,                              -- 用户昵称
  scores        JSONB NOT NULL,                             -- {"D":8,"S":3,"E":7,"O":5} 四维得分
  code          TEXT NOT NULL,                              -- "D8-S3-E7-O5" 人格代码
  personality   JSONB NOT NULL,                             -- {"id":"ivyWeaver","name":"青藤织者","emoji":"🌿"}
  answers       JSONB NOT NULL,                             -- [{q:1, dim:"D", text:"问题文本", opt:"A", optText:"选项文本"}, ...]
  created_at    TIMESTAMPTZ DEFAULT NOW(),                  -- 提交时间
  user_agent    TEXT,                                       -- 浏览器 UA（可选分析用）
  ip_hash       TEXT                                        -- IP 的 SHA256 哈希（隐私安全，不做精确追踪）
);

-- 2. 索引：加速按时间查询
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results (created_at DESC);

-- 3. 开启 Row Level Security（安全）
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- 4. 策略：任何人都可以插入（提交测试）
CREATE POLICY "allow_insert_for_all" ON results
  FOR INSERT WITH CHECK (true);

-- 5. 策略：任何人都可以读取（给匿名用户查询权限，管理后台用）
-- 注意：管理后台通过服务端 API（service_role key）读取，所以这里只允许 insert
CREATE POLICY "allow_select_for_all" ON results
  FOR SELECT USING (true);

-- 6. 策略：禁止修改和删除（普通用户无权限）
CREATE POLICY "deny_update_for_all" ON results
  FOR UPDATE USING (false);

CREATE POLICY "deny_delete_for_all" ON results
  FOR DELETE USING (false);
