async function refreshAccess(refreshToken) {
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  });
  const tok = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).then(r => r.json());
  if (!tok.access_token) throw new Error(tok.error_description || tok.error || 'NO_ACCESS');
  return tok.access_token;
}

async function gget(url, token) {
  const r = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error?.message || JSON.stringify(j.error || j).slice(0, 200));
  return j;
}

function daysAgo(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d.toISOString().slice(0, 10);
}

function rangeDates(range) {
  const end = daysAgo(1);
  if (range === '48h') return { start: daysAgo(2), end };
  if (range === '7d') return { start: daysAgo(7), end };
  if (range === '90d') return { start: daysAgo(90), end };
  if (range === '365d') return { start: daysAgo(365), end };
  if (range === 'all') return { start: '2006-01-01', end };
  return { start: daysAgo(28), end };
}

function isoSec(iso) {
  const m = String(iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  return (Number(m[1] || 0) * 3600) + (Number(m[2] || 0) * 60) + Number(m[3] || 0);
}

export default async function handler(req, res) {
  try {
    const refresh = req.query.refresh || req.body?.refresh;
    if (!refresh) return res.status(400).json({ error: 'NO_TOKEN' });
    const token = await refreshAccess(refresh);
    const range = req.query.range || '28d';
    const { start, end } = rangeDates(range);
    const me = await gget('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true', token);
    const channels = (me.items || []).map(c => ({
      channelId: c.id, name: c.snippet?.title, handle: c.snippet?.customUrl || '',
      thumb: c.snippet?.thumbnails?.default?.url || null,
      subs: Number(c.statistics?.subscriberCount || 0),
      views: Number(c.statistics?.viewCount || 0),
      videos: Number(c.statistics?.videoCount || 0),
    }));
    const main = channels[0];
    if (!main) return res.status(404).json({ error: 'NO_CHANNEL' });
    const ids = req.query.channelId || main.channelId;
    const summary = await gget(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares`, token);
    const geo = await gget(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=country&metrics=views&sort=-views&maxResults=6`, token).catch(() => ({ rows: [] }));
    const age = await gget(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=ageGroup,gender&metrics=viewerPercentage&sort=-viewerPercentage&maxResults=8`, token).catch(() => ({ rows: [] }));
    const traffic = await gget(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=insightTrafficSourceType&metrics=views&sort=-views&maxResults=8`, token).catch(() => ({ rows: [] }));
    const topVids = await gget(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=video&metrics=views,averageViewDuration,estimatedMinutesWatched&sort=-views&maxResults=12`, token).catch(() => ({ rows: [] }));
    const videoIds = (topVids.rows || []).map(r => r[0]).filter(Boolean);
    let meta = {};
    if (videoIds.length) {
      const vd = await gget(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(',')}`, token).catch(() => ({ items: [] }));
      (vd.items || []).forEach(v => {
        const m = String(v.contentDetails?.duration || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        const sec = m ? (Number(m[1]||0)*3600)+(Number(m[2]||0)*60)+Number(m[3]||0) : 0;
        meta[v.id] = { title: v.snippet?.title, thumb: v.snippet?.thumbnails?.medium?.url || v.snippet?.thumbnails?.default?.url || null, seconds: sec, kind: sec > 0 && sec <= 180 ? 'short' : 'long' };
      });
    }
    let retention = [];
    if (videoIds[0]) {
      const ret = await gget(`https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&filters=video==${videoIds[0]}&dimensions=elapsedVideoTimeRatio&metrics=audienceWatchRatio,relativeRetentionPerformance`, token).catch(() => ({ rows: [] }));
      retention = (ret.rows || []).map(r => ({ at: r[0], watch: r[1], vsSimilar: r[2] }));
    }
    const cols = (rep) => (rep.columnHeaders || []).map(c => c.name);
    const asObjs = (rep) => { const c = cols(rep); return (rep.rows || []).map(row => Object.fromEntries(c.map((k, i) => [k, row[i]]))); };
    const videos = asObjs(topVids).map(v => ({ ...v, ...(meta[v.video] || {}) }));
    return res.json({ connected: true, range, period: { start, end }, channelId: ids, channels, summary: asObjs(summary)[0] || {}, geo: asObjs(geo), audience: asObjs(age), traffic: asObjs(traffic), topVideos: videos, shorts: videos.filter(v => v.kind === 'short'), longs: videos.filter(v => v.kind !== 'short'), retention });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
