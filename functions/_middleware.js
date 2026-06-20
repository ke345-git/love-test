// Cloudflare Pages Middleware — CORS + 速率限制
// 对所有 /api/* 请求生效

const RATE_MAP = new Map();
const RATE_WINDOW = 60000; // 1 分钟窗口
const RATE_LIMIT = 30;     // 每分钟最多 30 次

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);

  // 只对 /api/ 路径做限流
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  // 速率限制
  const ip = request.headers.get('cf-connecting-ip') || 'unknown';
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;

  if (!RATE_MAP.has(ip)) {
    RATE_MAP.set(ip, []);
  }
  const timestamps = RATE_MAP.get(ip);

  // 清理过期记录
  while (timestamps.length && timestamps[0] < windowStart) {
    timestamps.shift();
  }

  if (timestamps.length >= RATE_LIMIT) {
    return new Response(JSON.stringify({ error: '请求太频繁，请稍后再试' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  timestamps.push(now);

  // 继续到实际的 API handler
  return next();
}
