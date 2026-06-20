// 诊断接口 — 验证部署是否成功、环境变量是否配置
// GET /api/health
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  res.status(200).json({
    ok: true,
    time: new Date().toISOString(),
    env: {
      has_supabase_url: !!process.env.SUPABASE_URL,
      has_supabase_key: !!process.env.SUPABASE_ANON_KEY,
      has_admin_password: !!process.env.ADMIN_PASSWORD,
      supabase_url_prefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.slice(0, 30) + '...' : 'MISSING'
    },
    files: 'If you see this, API functions are working'
  });
};
