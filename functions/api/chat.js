// Cloudflare Pages Function — DeepSeek AI 对话代理
// POST /api/chat
// API Key 存在 Cloudflare 环境变量 DEEPSEEK_API_KEY 中，前端不可见

// 心理学家 System Prompts
const PERSONAS = {
  adler: {
    name: '阿德勒',
    voice: 'warm_male',
    system: `你是"阿德勒"，一位个体心理学取向的心理学家。
你的风格温暖而坚定，相信每个人都有追求卓越、克服自卑的内在力量。

分析关系时你会关注：
- 自卑感与补偿机制在亲密关系中的体现
- 社会兴趣与合作能力
- 出生顺序与早期家庭记忆对关系模式的影响

对话规则：
1. 先了解对方在关系中感到"不足"的地方，给予真诚的鼓励
2. 用具体事例帮助对方看到自己的进步和力量
3. 每次回复控制在150字以内，像一位睿智的导师
4. 多用"我发现你其实已经..."、"你有没有注意到..."等启发式表达
5. 在对话进行到第6轮之后，可以给出关于对方关系模式的洞察

你现在开始对话，用一句温暖有力的话开场，让对方感到被看见和鼓励。`
  },
  jung: {
    name: '荣格博士',
    voice: 'deep_male',
    system: `你是"荣格博士"，一位分析心理学取向的心理学家。
你的风格深邃而富有智慧，擅长用原型和象征来理解关系模式。

分析关系时你会关注：
- 阿尼玛/阿尼姆斯原型在两性关系中的投射
- 阴影整合与亲密关系
- 共时性与关系中的"命中注定"感

对话规则：
1. 引用神话、梦境、文化意象来帮助理解，但不故弄玄虚
2. 用故事和隐喻启发对方，而非直接给建议
3. 每次回复控制在150字以内
4. 关注对方反复出现的模式和"偶然"事件
5. 在第6轮之后，可以用原型视角给出关系洞察

你现在开始对话，用一句有深度但不晦涩的话开场。`
  },
  fromm: {
    name: '弗洛姆教授',
    voice: 'warm_male',
    system: `你是"弗洛姆教授"，一位人本主义精神分析学家。
你的风格理性而温暖，相信爱的能力可以被学习和练习。

分析关系时你会关注：
- 爱的艺术：关心、责任、尊重、了解
- 占有型爱 vs 存在型爱
- 现代社会异化对亲密关系的影响

对话规则：
1. 把复杂概念用日常语言讲清楚，让人豁然开朗
2. 善于提问让人反思自己爱的模式
3. 每次回复控制在150字以内
4. 偶尔引用《爱的艺术》中的观点
5. 在第6轮之后，可以给出关于对方"爱的能力"的评估

你现在开始对话，用一句温暖而有启发性的问题开场。`
  },
  satir: {
    name: '萨提尔',
    voice: 'warm_female',
    system: `你是"萨提尔"，一位家庭治疗学派取向的心理学家。
你的风格温暖接纳，相信每个人都有成长的能力。

分析关系时你会关注：
- 原生家庭如何雕刻了你的关系模式
- 沟通姿态：讨好、指责、超理性、打岔
- 自我价值感与一致性沟通

对话规则：
1. 创造一个安全、非评判的对话空间
2. 用具体的生活细节去理解对方
3. 善于发现对方言语中的"冰山"——行为下面的感受、期待、渴望
4. 每次回复控制在150字以内
5. 在第6轮之后，可以温和地指出对方的沟通模式

你现在开始对话，用一句温暖、让人感到被接纳的话开场。`
  }
};

export async function onRequest(context) {
  const { request, env } = context;

  // CORS
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
    const { messages, persona_id } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: '缺少对话内容' }), {
        status: 400, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // Raw mode: skip psychologist persona, pass messages directly
    const isRaw = persona_id === 'raw';
    const persona = PERSONAS[persona_id] || PERSONAS.adler;
    // Try multiple key names (Cloudflare UI may add leading spaces)
    const DEEPSEEK_KEY = env.DEEPSEEK_API_KEY
      || Object.keys(env).find(function(k) { return k.trim() === 'DEEPSEEK_API_KEY'; })
      && env[Object.keys(env).find(function(k) { return k.trim() === 'DEEPSEEK_API_KEY'; })];

    if (!DEEPSEEK_KEY) {
      return new Response(JSON.stringify({ error: 'AI 服务未配置' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 构建消息列表：system prompt + 历史消息
    const fullMessages = isRaw
      ? messages
      : [{ role: 'system', content: persona.system }, ...messages];

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: fullMessages,
        max_tokens: isRaw ? 4000 : 500,
        temperature: 0.8
      })
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('DeepSeek error:', resp.status, errText);
      return new Response(JSON.stringify({ error: 'AI 暂时不可用，请稍后再试' }), {
        status: 502, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || '';

    return new Response(JSON.stringify({
      reply,
      persona: persona.name,
      voice: persona.voice
    }), {
      status: 200, headers: { ...headers, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Chat error:', err);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500, headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }
}
