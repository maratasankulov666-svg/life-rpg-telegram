// api/ai.js
//
// Vercel Serverless Function. Игра стучится сюда (/api/ai), а функция сама
// пробует несколько бесплатных AI-провайдеров по очереди:
//   1. Groq — самый быстрый, бесплатный, без карты (GROQ_API_KEY)
//   2. Google Gemini — запасной вариант, тоже бесплатный (GEMINI_API_KEY)
// Если оба недоступны — отвечаем ошибкой, а игра сама покажет офлайн-совет
// (это уже встроено во фронтенд, ничего дополнительно настраивать не надо).
//
// Ответ в любом случае приводится к виду { content: [{ type:'text', text }] } —
// это формат, который ждёт App.jsx, так что сам фронтенд трогать не нужно.

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
  return messages.some(m => Array.isArray(m.content) && m.content.some(b => b && b.type === 'image'));
}

async function tryGemini(system, messages) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY не задан');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: toGeminiParts(m.content),
  }));

  const model = process.env.GEMINI_MODEL || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: { maxOutputTokens: 1000 },
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(`Gemini HTTP ${response.status}: ${JSON.stringify(data)}`);
    err.status = response.status;
    throw err;
  }

  const text = (data.candidates || [])
    .flatMap(c => (c.content && c.content.parts ? c.content.parts : []).map(p => p.text || ''))
    .join('\n')
    .trim();

  if (!text) throw new Error('Gemini вернул пустой ответ');
  return text;
}

async function tryGroq(system, messages) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY не задан');
  // Модель по умолчанию (gpt-oss-120b) не понимает картинки — фото еды и т.п. идёт сразу в Gemini.
  if (hasImageContent(messages)) throw new Error('SKIP: сообщение с изображением, Groq текстовый');

  const groqMessages = [
    ...(system ? [{ role: 'system', content: system }] : []),
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content })),
  ];

  const model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages: groqMessages, max_tokens: 1000 }),
  });

  const data = await response.json();
  if (!response.ok) {
    const err = new Error(`Groq HTTP ${response.status}: ${JSON.stringify(data)}`);
    err.status = response.status;
    throw err;
  }

  const text = (data.choices || [])
    .map(c => (c.message && c.message.content) || '')
    .join('\n')
    .trim();

  if (!text) throw new Error('Groq вернул пустой ответ');
  return text;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { system, messages } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: 'Missing "messages" in request body' });
    return;
  }

  const providers = [
    { name: 'groq', run: tryGroq },
    { name: 'gemini', run: tryGemini },
  ];

  const errors = [];
  for (const provider of providers) {
    try {
      const text = await provider.run(system, messages);
      res.status(200).json({ content: [{ type: 'text', text }], _provider: provider.name });
      return;
    } catch (e) {
      errors.push(`${provider.name}: ${e && e.message ? e.message : e}`);
    }
  }

  // Оба провайдера не сработали — фронтенд сам переключится на офлайн-совет.
  res.status(503).json({ error: 'Все AI-провайдеры недоступны', details: errors });
}
