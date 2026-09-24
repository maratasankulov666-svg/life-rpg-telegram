// /api/youtube — прокси к YouTube Data API v3 (ключ живёт только на сервере, как и у /api/ai).
// Переменная окружения: YOUTUBE_API_KEY. Формат Vercel/Node; если у тебя другой хостинг — тело то же.
// Запросы: /api/youtube?handle=@name  или  /api/youtube?id=UCxxxxxxxx
export default async function handler(req, res) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(500).json({ error: 'YOUTUBE_API_KEY не задан на сервере' });

  const { handle, id } = req.query || {};
  if (!handle && !id) return res.status(400).json({ error: 'нужен handle или id' });

  const params = new URLSearchParams({ part: 'snippet,statistics', key });
  if (id) params.set('id', id);
  else params.set('forHandle', handle.startsWith('@') ? handle : '@' + handle);

  try {
    const r = await fetch('https://www.googleapis.com/youtube/v3/channels?' + params);
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'YouTube API error' });
    const ch = data.items && data.items[0];
    if (!ch) return res.status(404).json({ error: 'Канал не найден' });
    const st = ch.statistics || {};
    res.setHeader('Cache-Control', 's-maxage=600');
    return res.status(200).json({
      channelId: ch.id,
      name: ch.snippet.title,
      handle: ch.snippet.customUrl || null,
      thumb: ch.snippet.thumbnails?.default?.url || null,
      subs: st.hiddenSubscriberCount ? null : Number(st.subscriberCount || 0),
      views: Number(st.viewCount || 0),
      videos: Number(st.videoCount || 0),
    });
  } catch (e) {
    return res.status(502).json({ error: String(e && e.message ? e.message : e) });
  }
}
