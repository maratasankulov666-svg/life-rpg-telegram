// Озвучка наставников нейросетевыми голосами Gemini TTS.
// POST { text, voice, style } → { mime: 'audio/wav', audio: base64 }.
// Ключ — тот же GEMINI_API_KEY, что и для чата. Модель можно задать через GEMINI_TTS_MODEL.

const MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-tts', 'gemini-2.5-pro-preview-tts'];
const VOICES = new Set([
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus',
  'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar',
  'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
]);

function pcmToWav(pcm, rate = 24000, channels = 1, bits = 16) {
  const header = Buffer.alloc(44);
  const byteRate = (rate * channels * bits) / 8;
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

export { pcmToWav };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { res.status(503).json({ error: 'NOT_CONFIGURED' }); return; }
  const body = req.body || {};
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 420);
  if (!text) { res.status(400).json({ error: 'Missing text' }); return; }
  const voice = VOICES.has(body.voice) ? body.voice : 'Kore';
  const style = String(body.style || '').slice(0, 300);
  const prompt = style ? `${style}:\n${text}` : text;
  const models = process.env.GEMINI_TTS_MODEL ? [process.env.GEMINI_TTS_MODEL, ...MODELS] : MODELS;
  const errors = [];
  for (const model of models) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 25000);
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
          },
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        errors.push(`${model}: HTTP ${r.status}`);
        if (r.status === 404 || r.status === 400) continue;
        res.status(r.status === 429 ? 429 : 502).json({ error: `TTS HTTP ${r.status}`, details: errors });
        return;
      }
      const part = (data.candidates || []).flatMap(c => (c.content && c.content.parts) || []).find(p => p.inlineData && p.inlineData.data);
      if (!part) { errors.push(`${model}: no audio`); continue; }
      const mime = part.inlineData.mimeType || '';
      const raw = Buffer.from(part.inlineData.data, 'base64');
      const rate = Number((mime.match(/rate=(\d+)/) || [])[1]) || 24000;
      const wav = /wav/i.test(mime) ? raw : pcmToWav(raw, rate);
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({ mime: 'audio/wav', audio: wav.toString('base64'), model, voice });
      return;
    } catch (e) {
      errors.push(`${model}: ${e && e.name === 'AbortError' ? 'timeout' : (e && e.message) || e}`);
    } finally { clearTimeout(timer); }
  }
  res.status(502).json({ error: 'TTS недоступен', details: errors });
}
