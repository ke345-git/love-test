// =============================================================
// Vercel Serverless Function — 管理后台获取所有测试结果
// GET /api/results?password=xxx
// 零依赖：直接用 Supabase REST API + Node.js 内置模块
// =============================================================

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // ----- 密码验证 -----
  const { password } = req.query;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: '服务器未配置管理密码。请在 Vercel 环境变量中添加 ADMIN_PASSWORD' });
  }
  if (!password || password !== adminPassword) {
    return res.status(401).json({ error: '密码错误' });
  }

  // ----- 从 Supabase 读取数据（直接 REST API，零依赖）-----
  try {
    // 此处把 results 修改为 test_results，和数据库表名一致
    const url = `${process.env.SUPABASE_URL}/rest/v1/test_results?select=*&order=created_at.desc&limit=500`;

    const resp = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      }
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Supabase query error:', resp.status, errText);
      return res.status(500).json({ error: '查询失败', detail: resp.status + ': ' + errText.slice(0, 200) });
    }

    const data = await resp.json();

    return res.status(200).json({
      count: data.length,
      results: data
    });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: '服务器错误', detail: err.message });
  }
};
