// Cloudflare Pages Function — MiMo-TTS 语音合成代理
// POST /api/tts
// API Key 存在 Cloudflare 环境变量 MIMO_API_KEY 中

// 音色映射
const VOICES = {
  gentle_female: 'mimo-tts-gentle-female',
  deep_male: 'mimo-tts-deep-male',
  warm_male: 'mimo-tts-warm-male',
  warm_female: 'mimo-tts-warm-female'
};

// 简单内存缓存（同一 Cloudflare Worker 实例内有效）
const cache = new Map();
const CACHE_TTL = 86400000; // 24h

function cacheKey(text, voice) {
  return `${voice}:${text}`;
}

export async function onRequest(context) {
  const { request, env } = context;

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  try {
    const body = await request.json();
    const { text, voice } = body;

    if (!text || typeof text !== 'string' || text.length > 500) {
      return new Response(JSON.stringify({ error: '文本无效或过长（最多500字）' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 检查缓存
    const key = cacheKey(text, voice || 'gentle_female');
    const cached = cache.get(key);
    if (cached && (Date.now() - cached.time < CACHE_TTL)) {
      return new Response(cached.audio, {
        status: 200,
        headers: { ...headers, 'Content-Type': 'audio/mpeg', 'X-Cache': 'HIT' }
      });
    }

    const MIMO_KEY = env.MIMO_API_KEY;
    if (!MIMO_KEY) {
      return new Response(JSON.stringify({ error: 'TTS 服务未配置' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const voiceId = VOICES[voice] || VOICES.gentle_female;

    // MiMo-TTS API 调用
    const resp = await fetch('https://api.mimo.xiaomi.com/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MIMO_KEY}`
      },
      body: JSON.stringify({
        model: 'MiMo-V2.5-TTS',
        input: text,
        voice: voiceId,
        response_format: 'mp3',
        speed: 1.0
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('MiMo TTS error:', resp.status, errText);

      // 如果 MiMo 不可用，返回纯文本（前端降级处理）
      return new Response(JSON.stringify({ error: 'TTS 暂不可用', fallback: true }), {
        status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const audioBuffer = await resp.arrayBuffer();

    // 存入缓存
    cache.set(key, { audio: audioBuffer, time: Date.now() });

    return new Response(audioBuffer, {
      status: 200,
      headers: { ...headers, 'Content-Type': 'audio/mpeg', 'X-Cache': 'MISS' }
    });

  } catch (err) {
    console.error('TTS error:', err);
    return new Response(JSON.stringify({ error: 'TTS 服务错误', fallback: true }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}
