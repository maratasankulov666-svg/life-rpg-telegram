const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
].join(' ');

function originOf(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(500).send('Нет GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET в Vercel');
  }
  const base = originOf(req);
  const redirectUri = `${base}/api/youtube-oauth`;
  const q = req.query || {};

  if (!q.code) {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', SCOPES);
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
    res.writeHead(302, { Location: url.toString() });
    return res.end();
  }

  try {
    const body = new URLSearchParams({
      code: q.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });
    const tok = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }).then(r => r.json());
    if (!tok.refresh_token && !tok.access_token) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send('<p>Google не вернул токен.</p><pre>' + JSON.stringify(tok) + '</pre>');
    }
    const payload = JSON.stringify({
      refresh: tok.refresh_token || '',
      access: tok.access_token || '',
      at: Date.now(),
    });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send('<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system;background:#0B0F14;color:#E8EEF8;padding:24px"><p>Канал подключен. Возвращаю в игру…</p><script>try{localStorage.setItem("lrpg_yt_oauth",' + JSON.stringify(payload) + ');}catch(e){}location.replace("/#youtube");</script><p><a href="/#youtube" style="color:#00E5FF">Открыть YouTube</a></p></body></html>');
  } catch (e) {
    return res.status(500).send(String(e.message || e));
  }
}
