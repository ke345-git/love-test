-- =============================================================
-- 恋爱人格代码 v3.0 — Supabase 数据库建表 SQL
-- 在 Supabase 项目 → SQL Editor → 粘贴执行
-- =============================================================

-- 1. 测试结果表（已有，如不存在则创建）
CREATE TABLE IF NOT EXISTS test_results (
  id               BIGSERIAL PRIMARY KEY,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nickname         TEXT NOT NULL,
  personality_type TEXT NOT NULL,
  scores           JSONB,
  answers          JSONB,
  ip               TEXT
);

CREATE INDEX IF NOT EXISTS idx_results_created_at ON test_results (created_at DESC);

-- 2. AI 对话记录表（新增）
CREATE TABLE IF NOT EXISTS chat_sessions (
  id              BIGSERIAL PRIMARY KEY,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nickname        TEXT NOT NULL,
  persona_id      TEXT NOT NULL,            -- 'nuwa' | 'jung' | 'fromm' | 'satir'
  persona_name    TEXT NOT NULL,            -- '女娲' | '荣格博士' | '弗洛姆教授' | '萨提尔'
  messages        JSONB NOT NULL DEFAULT '[]',  -- [{role, content, time}]
  summary         TEXT,                     -- AI 生成的对话摘要
  personality_result JSONB,                 -- 如果对话结束给出了人格分析
  ip              TEXT
);

CREATE INDEX IF NOT EXISTS idx_chat_created_at ON chat_sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_persona ON chat_sessions (persona_id);

-- 3. RLS 策略（test_results）
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_insert_for_all" ON test_results;
DROP POLICY IF EXISTS "allow_select_for_all" ON test_results;
DROP POLICY IF EXISTS "deny_update_for_all" ON test_results;
DROP POLICY IF EXISTS "deny_delete_for_all" ON test_results;

CREATE POLICY "allow_insert_for_all" ON test_results FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_select_for_all" ON test_results FOR SELECT USING (true);
CREATE POLICY "deny_update_for_all" ON test_results FOR UPDATE USING (false);
CREATE POLICY "deny_delete_for_all" ON test_results FOR DELETE USING (false);

-- 4. RLS 策略（chat_sessions）
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_insert_chat" ON chat_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_select_chat" ON chat_sessions FOR SELECT USING (true);
CREATE POLICY "deny_update_chat" ON chat_sessions FOR UPDATE USING (false);
CREATE POLICY "deny_delete_chat" ON chat_sessions FOR DELETE USING (false);

-- 5. 授权
GRANT SELECT, INSERT ON public.test_results TO anon;
GRANT SELECT, INSERT ON public.chat_sessions TO anon;
