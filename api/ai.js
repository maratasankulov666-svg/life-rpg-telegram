// api/ai.js
//
// Vercel Serverless Function. Игра стучится сюда (/api/ai), а функция сама
// идёт в Google Gemini API с ключом, который хранится только на сервере
// (переменная окружения GEMINI_API_KEY в настройках проекта на Vercel).
//
// Почему Gemini, а не Claude API напрямую: у Gemini есть постоянный
// бесплатный тариф (не 30-дневный пробный) — для простых задач вроде
// разбивки цели на квесты или недельной выжимки этого достаточно, и это
// ничего не будет стоить при личном использовании.
//
// Ответ приводится к тому же виду, что раньше отдавал Anthropic API
// ({ content: [{ type: 'text', text }] }) — поэтому в самой игре (App.jsx)
// логику разбора ответа менять не пришлось, только адрес запроса.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'GEMINI_API_KEY не задан на сервере (Vercel → Settings → Environment Variables)' });
    return;
  }
  const { system, messages } = req.body || {};
  if (!messages) {
    res.status(400).json({ error: 'Missing "messages" in request body' });
    return;
  }
  // Anthropic использует роли 'user' | 'assistant', Gemini — 'user' | 'model'.
  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content) }],
  }));
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  try {
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
      res.status(response.status).json(data);
      return;
    }
    const text = (data.candidates || [])
      .flatMap(c => (c.content && c.content.parts ? c.content.parts : []).map(p => p.text || ''))
      .join('\n')
      .trim();
    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (e) {
    res.status(502).json({ error: 'Upstream request failed', detail: String(e && e.message ? e.message : e) });
  }
}
