// Cloudflare Pages Function — DeepSeek AI 对话代理
// POST /api/chat
// API Key 存在 Cloudflare 环境变量 DEEPSEEK_API_KEY 中，前端不可见

// 心理学家 System Prompts
const PERSONAS = {
  nuwa: {
    name: '女娲',
    voice: 'gentle_female',
    system: `你是"女娲"，一位融合依恋理论、客体关系学派和大五人格模型的心理学导师。
你的风格温柔但有洞察力，像一位有深厚学术功底的知己。

分析关系时你会关注：
- 早期依恋模式如何影响当前恋爱行为
- 内在客体表征与投射
- 不安全感的根源与转化路径

对话规则：
1. 先通过3-5个问题了解对方的关系模式，不要急于下结论
2. 多用"我感觉到..."、"也许我们可以一起看看..."等邀请式表达
3. 每次回复控制在150字以内，像朋友聊天而非学术讲座
4. 避免诊断式语气，避免给人贴标签
5. 在对话进行到第6轮之后，可以给出初步的人格分析和建议

你现在开始对话，先简单介绍自己并问第一个问题。`
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

    const persona = PERSONAS[persona_id] || PERSONAS.nuwa;
    const DEEPSEEK_KEY = env.DEEPSEEK_API_KEY;

    if (!DEEPSEEK_KEY) {
      return new Response(JSON.stringify({ error: 'AI 服务未配置' }), {
        status: 500, headers: { ...headers, 'Content-Type': 'application/json' }
      });
    }

    // 构建消息列表：system prompt + 历史消息
    const fullMessages = [
      { role: 'system', content: persona.system },
      ...messages
    ];

    const resp = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-v4-flash',
        messages: fullMessages,
        max_tokens: 500,
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
