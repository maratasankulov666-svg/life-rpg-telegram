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
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req, res) {
  try {
    const refresh = req.query.refresh || req.body?.refresh;
    if (!refresh) return res.status(400).json({ error: 'Нет refresh-токена. Сначала «Войти в Google».' });
    const token = await refreshAccess(refresh);

    const me = await gget('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true', token);
    const channels = (me.items || []).map(c => ({
      channelId: c.id,
      name: c.snippet?.title,
      handle: c.snippet?.customUrl || '',
      thumb: c.snippet?.thumbnails?.default?.url || null,
      subs: Number(c.statistics?.subscriberCount || 0),
      views: Number(c.statistics?.viewCount || 0),
      videos: Number(c.statistics?.videoCount || 0),
    }));
    const main = channels[0];
    if (!main) return res.status(404).json({ error: 'У этого Google-аккаунта нет канала' });

    const start = daysAgo(28);
    const end = daysAgo(1);
    const ids = req.query.channelId || main.channelId;

    const summary = await gget(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&metrics=views,estimatedMinutesWatched,averageViewDuration,subscribersGained,subscribersLost,likes,comments,shares`,
      token,
    );

    const geo = await gget(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=country&metrics=views&sort=-views&maxResults=6`,
      token,
    ).catch(() => ({ rows: [] }));

    const age = await gget(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=ageGroup,gender&metrics=viewerPercentage&sort=-viewerPercentage&maxResults=8`,
      token,
    ).catch(() => ({ rows: [] }));

    const traffic = await gget(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=insightTrafficSourceType&metrics=views&sort=-views&maxResults=8`,
      token,
    ).catch(() => ({ rows: [] }));

    const topVids = await gget(
      `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&dimensions=video&metrics=views,averageViewDuration,estimatedMinutesWatched&sort=-views&maxResults=8`,
      token,
    ).catch(() => ({ rows: [] }));

    let retention = [];
    const topId = topVids.rows && topVids.rows[0] && topVids.rows[0][0];
    if (topId) {
      const ret = await gget(
        `https://youtubeanalytics.googleapis.com/v2/reports?ids=channel==${ids}&startDate=${start}&endDate=${end}&filters=video==${topId}&dimensions=elapsedVideoTimeRatio&metrics=audienceWatchRatio,relativeRetentionPerformance`,
        token,
      ).catch(() => ({ rows: [] }));
      retention = (ret.rows || []).map(r => ({ at: r[0], watch: r[1], vsSimilar: r[2] }));
    }

    const cols = (rep) => (rep.columnHeaders || []).map(c => c.name);
    function asObjs(rep) {
      const c = cols(rep);
      return (rep.rows || []).map(row => Object.fromEntries(c.map((k, i) => [k, row[i]])));
    }

    return res.json({
      connected: true,
      period: { start, end },
      channels,
      summary: asObjs(summary)[0] || {},
      geo: asObjs(geo),
      audience: asObjs(age),
      traffic: asObjs(traffic),
      topVideos: asObjs(topVids),
      retention,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
