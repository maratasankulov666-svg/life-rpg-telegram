// Multi-provider AI Router. Keys only from env. Compatible response:
// { content: [{ type:'text', text }], _provider, _model, fallbackUsed }

const OPENAI_COMPAT = [
  { id: 'groq', env: 'GROQ_API_KEY', url: 'https://api.groq.com/openai/v1/chat/completions', modelEnv: 'GROQ_MODEL', model: 'llama-3.3-70b-versatile', models: ['llama-3.3-70b-versatile','llama-3.1-8b-instant','openai/gpt-oss-120b'], vision: false },
  { id: 'grok', env: 'XAI_API_KEY', url: 'https://api.x.ai/v1/chat/completions', modelEnv: 'XAI_MODEL', model: 'grok-2-latest', vision: false },
  { id: 'openrouter', env: 'OPENROUTER_API_KEY', url: 'https://openrouter.ai/api/v1/chat/completions', modelEnv: 'OPENROUTER_MODEL', model: 'openrouter/auto', vision: true },
  { id: 'mistral', env: 'MISTRAL_API_KEY', url: 'https://api.mistral.ai/v1/chat/completions', modelEnv: 'MISTRAL_MODEL', model: 'mistral-small-latest', vision: false },
  { id: 'cerebras', env: 'CEREBRAS_API_KEY', url: 'https://api.cerebras.ai/v1/chat/completions', modelEnv: 'CEREBRAS_MODEL', model: 'llama3.1-8b', vision: false },
  { id: 'nvidia', env: 'NVIDIA_API_KEY', url: 'https://integrate.api.nvidia.com/v1/chat/completions', modelEnv: 'NVIDIA_MODEL', model: 'meta/llama-3.1-8b-instruct', vision: false },
];

function configured() {
  const list = [];
  if (process.env.GROQ_API_KEY) list.push('groq');
  if (process.env.GEMINI_API_KEY) list.push('gemini');
  if (process.env.XAI_API_KEY) list.push('grok');
  if (process.env.OPENROUTER_API_KEY) list.push('openrouter');
  if (process.env.MISTRAL_API_KEY) list.push('mistral');
  if (process.env.CEREBRAS_API_KEY) list.push('cerebras');
  if (process.env.NVIDIA_API_KEY) list.push('nvidia');
  if (process.env.HF_TOKEN) list.push('huggingface');
  if (process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID) list.push('cloudflare');
  return list;
}

function toGeminiParts(content) {
  if (typeof content === 'string') return [{ text: content }];
  if (Array.isArray(content)) {
    return content.map(b => {
      if (b && b.type === 'image' && b.source) {
        return { inlineData: { mimeType: b.source.media_type || 'image/jpeg', data: b.source.data } };
      }
      return { text: (b && b.text) || '' };
    });
  }
  return [{ text: JSON.stringify(content) }];
}

function hasImageContent(messages) {
  return (messages || []).some(m => Array.isArray(m.content) && m.content.some(b => b && b.type === 'image'));
}

function asText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) return content.map(b => b?.text || '').join('\n');
  return JSON.stringify(content);
}

async function tryGemini(system, messages, { timeoutMs = 18000, maxTokens = 1000 } = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw Object.assign(new Error('NOT_CONFIGURED'), { code: 'NOT_CONFIGURED' });
  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: toGeminiParts(m.content),
          })),
          ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
          generationConfig: { maxOutputTokens: maxTokens },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      const err = new Error(`Gemini HTTP ${response.status}`);
      err.status = response.status;
      err.retryable = response.status === 429 || response.status >= 500;
      throw err;
    }
    const text = (data.candidates || []).flatMap(c => (c.content?.parts || []).map(p => p.text || '')).join('\n').trim();
    if (!text) throw new Error('EMPTY');
    return { text, model };
  } finally { clearTimeout(t); }
}

async function tryOpenAICompat(p, system, messages, { timeoutMs = 18000, maxTokens = 1000 } = {}) {
  const apiKey = process.env[p.env];
  if (!apiKey) throw Object.assign(new Error('NOT_CONFIGURED'), { code: 'NOT_CONFIGURED' });
  if (hasImageContent(messages) && !p.vision) throw Object.assign(new Error('SKIP_VISION'), { retryable: true });
  const models = [];
  if (process.env[p.modelEnv]) models.push(process.env[p.modelEnv]);
  if (p.model && !models.includes(p.model)) models.push(p.model);
  (p.models || []).forEach(m => { if (!models.includes(m)) models.push(m); });
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` };
  if (p.id === 'openrouter') headers['HTTP-Referer'] = 'https://life-rpg-telegram-five.vercel.app';
  const payloadMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: asText(m.content) })),
  ];
  let lastErr = null;
  for (const model of models) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const response = await fetch(p.url, {
        method: 'POST',
        headers,
        signal: ctrl.signal,
        body: JSON.stringify({ model, messages: payloadMessages, max_tokens: maxTokens }),
      });
      const data = await response.json();
      if (!response.ok) {
        const err = new Error(`${p.id} HTTP ${response.status} (${model})`);
        err.status = response.status;
        err.retryable = response.status === 429 || response.status >= 500 || response.status === 404;
        lastErr = err;
        if (response.status === 404) continue;
        throw err;
      }
      const text = (data.choices || []).map(c => c.message?.content || '').join('\n').trim();
      if (!text) throw new Error('EMPTY');
      return { text, model };
    } finally { clearTimeout(t); }
  }
  throw lastErr || new Error(`${p.id} failed`);
}

const DEFAULT_ORDER = ['gemini', 'grok', 'groq', 'cerebras', 'openrouter', 'mistral', 'nvidia'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const body = req.body || {};
  if (body.ping) {
    res.status(200).json({ configured: configured(), order: (process.env.AI_PROVIDER_ORDER || DEFAULT_ORDER.join(',')).split(',') });
    return;
  }
  const { system, messages, taskType, jsonMode } = body;
  if (!messages) {
    res.status(400).json({ error: 'Missing "messages"' });
    return;
  }
  const preferred = Array.isArray(body.order) && body.order.length ? body.order : (process.env.AI_PROVIDER_ORDER || DEFAULT_ORDER.join(',')).split(',').map(s => s.trim()).filter(Boolean);
  const wantVision = hasImageContent(messages);
  const errors = [];
  let fallbackUsed = false;
  let attempted = 0;

  const runners = {
    gemini: () => tryGemini(system, messages, { maxTokens: jsonMode ? 1200 : 1000 }),
  };
  OPENAI_COMPAT.forEach(p => { runners[p.id] = () => tryOpenAICompat(p, system, messages); });

  for (const id of preferred) {
    if (!runners[id]) continue;
    if (wantVision && id !== 'gemini' && id !== 'openrouter') { errors.push(`${id}: skip vision`); continue; }
    attempted += 1;
    try {
      const out = await runners[id]();
      res.status(200).json({
        content: [{ type: 'text', text: out.text }],
        _provider: id,
        _model: out.model,
        fallbackUsed,
        taskType: taskType || null,
      });
      return;
    } catch (e) {
      fallbackUsed = attempted > 0;
      errors.push(`${id}: ${e.message || e}`);
      if (e.code === 'NOT_CONFIGURED') continue;
      // 4xx провайдера (404 модель, 401 ключ) — идём к следующему, не останавливаем цепочку.
      if (e.status === 400 && e.retryable === false) {
        res.status(e.status).json({ error: e.message, details: errors });
        return;
      }
    }
  }

  res.status(503).json({ error: 'Все AI-провайдеры недоступны', details: errors, configured: configured() });
}
