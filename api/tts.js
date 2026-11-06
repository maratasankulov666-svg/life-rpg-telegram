// Озвучка наставников. У каждого наставника СВОЙ постоянный сервис и голос (чтобы голос не менялся):
//   google — Google Cloud Text-to-Speech (GOOGLE_TTS_API_KEY), WaveNet;
//   azure  — Azure Speech (AZURE_SPEECH_KEY + AZURE_SPEECH_REGION);
//   gemini — Gemini TTS (GEMINI_API_KEY), запасной: только если у сервиса наставника нет ключа.
// Распределение по умолчанию — ASSIGN ниже; переопределение без кода: TTS_ASSIGN="kaylen:azure,brum:google".
// Если у сервиса наставника кончился лимит — НЕ переключаемся на чужой голос, а отвечаем 429 с provider,
// и клиент на время говорит голосом телефона.
// POST { npc, text, voice, style } → { mime, audio: base64, provider }.

const GEMINI_MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-flash-tts', 'gemini-2.5-pro-preview-tts'];
const GEMINI_VOICES = new Set([
  'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede', 'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus',
  'Umbriel', 'Algieba', 'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar', 'Alnilam', 'Schedar',
  'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi', 'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
]);

// Кто кем озвучивается. Мужских голосов у Google два (B, D), у Azure один (Дмитрий) — так все трое
// мужчин звучат по-разному. Google (больше лимит) — у самых разговорчивых.
const ASSIGN = { kaylen: 'google', kasper: 'google', mira: 'google', tio: 'google', brum: 'azure', nori: 'azure', vera: 'azure' };

// Голоса наставников у Azure и Google (используется тот, что назначен; остальное — на случай TTS_ASSIGN).
const AZURE = {
  kaylen: { name: 'ru-RU-DmitryNeural', pitch: '-14%', rate: '-10%' },
  brum: { name: 'ru-RU-DmitryNeural', pitch: '-2%', rate: '+12%', volume: '+15%' },
  kasper: { name: 'ru-RU-DmitryNeural', pitch: '-8%', rate: '-20%' },
  nori: { name: 'ru-RU-DariyaNeural', pitch: '+8%', rate: '+12%' },
  mira: { name: 'ru-RU-SvetlanaNeural', pitch: '+6%', rate: '+10%' },
  vera: { name: 'ru-RU-SvetlanaNeural', pitch: '-6%', rate: '-2%' },
  tio: { name: 'ru-RU-DariyaNeural', pitch: '-4%', rate: '-16%' },
};
const GOOGLE = {
  kaylen: { name: 'ru-RU-Wavenet-B', pitch: -4, rate: 0.9 },
  brum: { name: 'ru-RU-Wavenet-D', pitch: -1, rate: 1.12 },
  kasper: { name: 'ru-RU-Wavenet-D', pitch: -3, rate: 0.84 },
  nori: { name: 'ru-RU-Wavenet-E', pitch: 3, rate: 1.12 },
  mira: { name: 'ru-RU-Wavenet-C', pitch: 1, rate: 1.1 },
  vera: { name: 'ru-RU-Wavenet-A', pitch: -2, rate: 1 },
  tio: { name: 'ru-RU-Wavenet-E', pitch: -1, rate: 0.85 },
};

function assignment() {
  const map = { ...ASSIGN };
  String(process.env.TTS_ASSIGN || '').split(',').forEach(pair => {
    const [npc, prov] = pair.split(':').map(x => (x || '').trim().toLowerCase());
    if (npc && ['google', 'azure', 'gemini'].includes(prov)) map[npc] = prov;
  });
  return map;
}
function isConfigured(id) {
  if (id === 'azure') return !!(process.env.AZURE_SPEECH_KEY && process.env.AZURE_SPEECH_REGION);
  if (id === 'google') return !!process.env.GOOGLE_TTS_API_KEY;
  if (id === 'gemini') return !!process.env.GEMINI_API_KEY;
  return false;
}

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

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function httpError(status, msg) { const e = new Error(msg); e.status = status; return e; }

async function withTimeout(ms, fn) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try { return await fn(ctrl.signal); } finally { clearTimeout(t); }
}

async function viaAzure({ npc, text }) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return null;
  const v = AZURE[npc] || AZURE.vera;
  const ssml = `<speak version="1.0" xml:lang="ru-RU"><voice name="${v.name}"><prosody pitch="${v.pitch}" rate="${v.rate}"${v.volume ? ` volume="${v.volume}"` : ''}>${xmlEscape(text)}</prosody></voice></speak>`;
  return withTimeout(15000, async (signal) => {
    const r = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST', signal,
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'life-rpg' },
      body: ssml,
    });
    if (!r.ok) throw httpError(r.status, `azure HTTP ${r.status}`);
    const buf = Buffer.from(await r.arrayBuffer());
    return { mime: 'audio/mpeg', audio: buf.toString('base64'), provider: 'azure', voice: v.name };
  });
}

async function viaGoogle({ npc, text, voice }) {
  const key = process.env.GOOGLE_TTS_API_KEY;
  if (!key) return null;
  const chirp = (process.env.GOOGLE_TTS_FAMILY || '').toLowerCase() === 'chirp';
  const v = GOOGLE[npc] || GOOGLE.vera;
  const voiceName = chirp && GEMINI_VOICES.has(voice) ? `ru-RU-Chirp3-HD-${voice}` : v.name;
  const audioConfig = chirp ? { audioEncoding: 'MP3', speakingRate: v.rate } : { audioEncoding: 'MP3', speakingRate: v.rate, pitch: v.pitch };
  return withTimeout(15000, async (signal) => {
    const r = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${key}`, {
      method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: { text }, voice: { languageCode: 'ru-RU', name: voiceName }, audioConfig }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok || !data.audioContent) throw httpError(r.status || 502, `google HTTP ${r.status}`);
    return { mime: 'audio/mpeg', audio: data.audioContent, provider: 'google', voice: voiceName };
  });
}

async function viaGemini({ text, voice, style }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const voiceName = GEMINI_VOICES.has(voice) ? voice : 'Kore';
  const prompt = style ? `${String(style).slice(0, 300)}:\n${text}` : text;
  const models = process.env.GEMINI_TTS_MODEL ? [process.env.GEMINI_TTS_MODEL, ...GEMINI_MODELS] : GEMINI_MODELS;
  let last = null;
  for (const model of models) {
    try {
      const out = await withTimeout(25000, async (signal) => {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
          method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } } },
          }),
        });
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw httpError(r.status, `gemini HTTP ${r.status} (${model})`);
        const part = (data.candidates || []).flatMap(c => (c.content && c.content.parts) || []).find(p => p.inlineData && p.inlineData.data);
        if (!part) throw httpError(502, `gemini no audio (${model})`);
        const mime = part.inlineData.mimeType || '';
        const raw = Buffer.from(part.inlineData.data, 'base64');
        const rate = Number((mime.match(/rate=(\d+)/) || [])[1]) || 24000;
        const wav = /wav/i.test(mime) ? raw : pcmToWav(raw, rate);
        return { mime: 'audio/wav', audio: wav.toString('base64'), provider: 'gemini', voice: voiceName, model };
      });
      return out;
    } catch (e) {
      last = e;
      if (e.status === 404 || e.status === 400) continue;
      throw e;
    }
  }
  throw last || httpError(502, 'gemini failed');
}

const RUNNERS = { azure: viaAzure, google: viaGoogle, gemini: viaGemini };
const FALLBACK_ORDER = ['google', 'azure', 'gemini'];

export { pcmToWav, xmlEscape, assignment };

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }
  const body = req.body || {};
  const text = String(body.text || '').replace(/\s+/g, ' ').trim().slice(0, 420);
  if (!text) { res.status(400).json({ error: 'Missing text' }); return; }
  const npc = String(body.npc || '');
  const args = { npc, text, voice: body.voice, style: body.style };
  // Постоянный сервис наставника. Запасной — только если у него вообще нет ключа (тогда голос «временный»).
  const assigned = assignment()[npc] || 'google';
  const provider = isConfigured(assigned) ? assigned : FALLBACK_ORDER.find(isConfigured);
  if (!provider) { res.status(503).json({ error: 'NOT_CONFIGURED' }); return; }
  try {
    const out = await RUNNERS[provider](args);
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json({ ...out, assigned, substitute: provider !== assigned });
  } catch (e) {
    const status = e && e.status === 429 ? 429 : 502;
    res.status(status).json({ error: status === 429 ? 'LIMIT' : 'TTS недоступен', provider, details: [(e && e.message) || String(e)] });
  }
}
