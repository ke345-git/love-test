// =============================================================
// Vercel Serverless Function — 接收测试结果并存入 Supabase
// POST /api/submit
// 零依赖：直接用 Supabase REST API + Node.js 内置模块
// =============================================================

// 简单的请求频率限制（内存缓存，Vercel 冷启动会重置）
const RATE_LIMIT = new Map();
const RATE_WINDOW_MS = 10000;
const MAX_REQUESTS_PER_WINDOW = 3;

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ----- 频率限制 -----
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_WINDOW_MS;

  if (!RATE_LIMIT.has(clientIp)) RATE_LIMIT.set(clientIp, []);
  const timestamps = RATE_LIMIT.get(clientIp);
  while (timestamps.length && timestamps[0] < windowStart) timestamps.shift();

  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: '提交太频繁，请稍后再试' });
  }
  timestamps.push(now);

  // ----- 参数校验 -----
  const { nickname, scores, code, personality, answers } = req.body || {};
  if (!nickname || typeof nickname !== 'string' || !nickname.trim()) {
    return res.status(400).json({ error: '缺少昵称' });
  }
  if (!scores || !scores.D || !scores.S || !scores.E || !scores.O) {
    return res.status(400).json({ error: '缺少得分数据' });
  }
  if (!code) return res.status(400).json({ error: '缺少人格代码' });
  if (!personality || !personality.id || !personality.name) {
    return res.status(400).json({ error: '缺少人格类型' });
  }
  if (!answers || !Array.isArray(answers) || answers.length !== 15) {
    return res.status(400).json({ error: '缺少答题数据（需要完整的15道题回答）' });
  }

  // ----- 存入 Supabase（直接 REST API，零依赖）-----
  try {
    const crypto = require('crypto');
    const ipHash = crypto.createHash('sha256').update(clientIp).digest('hex').slice(0, 16);

    const url = `${process.env.SUPABASE_URL}/rest/v1/results`;
    const body = JSON.stringify({
      nickname: nickname.trim(),
      scores,
      code,
      personality,
      answers,
      user_agent: req.headers['user-agent'] || null,
      ip_hash: ipHash
    });

    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Supabase insert error:', resp.status, errText);
      return res.status(500).json({ error: '保存失败，请重试' });
    }

    return res.status(200).json({ success: true, message: '结果已保存' });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: '服务器错误，请稍后再试' });
  }
};
