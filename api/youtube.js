const API = 'https://www.googleapis.com/youtube/v3';

async function yt(path, params, key) {
  const u = new URL(API + path);
  Object.entries({ ...params, key }).forEach(([k, v]) => { if (v) u.searchParams.set(k, v); });
  const r = await fetch(u);
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || ('HTTP ' + r.status));
  return j;
}

export default async function handler(req, res) {
  try {
    const key = process.env.YOUTUBE_API_KEY;
    if (!key) return res.status(500).json({ error: 'NO_KEY', hint: 'Добавь YOUTUBE_API_KEY в Vercel' });
    const handle = (req.query.handle || '').replace(/^@/, '');
    const id = req.query.id || req.query.channelId;
    const wantVideos = req.query.videos === '1' || req.query.videos === 'true';

    let channelId = id;
    let snippet = null;
    let stats = null;

    if (!channelId && handle) {
      const s = await yt('/search', { part: 'snippet', q: handle, type: 'channel', maxResults: 1 }, key);
      const item = (s.items || [])[0];
      if (!item) return res.status(404).json({ error: 'NOT_FOUND' });
      channelId = item.snippet.channelId || item.id.channelId;
      snippet = item.snippet;
    }

    const ch = await yt('/channels', { part: 'snippet,statistics,contentDetails', id: channelId }, key);
    const c = (ch.items || [])[0];
    if (!c) return res.status(404).json({ error: 'NOT_FOUND' });
    snippet = c.snippet;
    stats = c.statistics;

    let recentVideos = [];
    if (wantVideos) {
      const uploads = c.contentDetails?.relatedPlaylists?.uploads;
      if (uploads) {
        const pl = await yt('/playlistItems', { part: 'snippet,contentDetails', playlistId: uploads, maxResults: 8 }, key);
        const ids = (pl.items || []).map(it => it.contentDetails.videoId).filter(Boolean).join(',');
        if (ids) {
          const vd = await yt('/videos', { part: 'snippet,statistics', id: ids }, key);
          recentVideos = (vd.items || []).map(v => ({
            id: v.id,
            title: v.snippet?.title,
            publishedAt: v.snippet?.publishedAt,
            views: Number(v.statistics?.viewCount || 0),
            likes: Number(v.statistics?.likeCount || 0),
            comments: Number(v.statistics?.commentCount || 0),
          }));
        }
      }
    }

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.json({
      name: snippet.title,
      handle: snippet.customUrl || handle || '',
      channelId,
      thumb: snippet.thumbnails?.default?.url || null,
      subs: Number(stats.subscriberCount || 0),
      views: Number(stats.viewCount || 0),
      videos: Number(stats.videoCount || 0),
      recentVideos,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
