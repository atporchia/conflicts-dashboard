const { createClient } = require('@supabase/supabase-js');
const { XMLParser } = require('fast-xml-parser');

function createAnonClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_ANON_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

function createServiceClient() {
  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key, { auth: { persistSession: false } });
}

const CONFLICT_TYPE_WORDS = new Set([
  'civil', 'war', 'internal', 'conflict', 'dispute', 'insurgency',
  'violence', 'gang', 'crisis', 'tension', 'unrest',
]);

const ARMED_CONFLICT_KEYWORDS = [
  'killed', 'wounded', 'casualties', 'dead', 'deaths',
  'attack', 'attacked', 'airstrike', 'bombing', 'bomb', 'explosion',
  'military', 'troops', 'forces', 'soldiers', 'army',
  'fighting', 'battle', 'offensive', 'counteroffensive',
  'ceasefire', 'truce', 'surrender',
  'rebel', 'insurgent', 'militant', 'jihadist',
  'missile', 'rocket', 'artillery', 'drone strike',
  'invasion', 'occupation', 'siege',
  'gunmen', 'armed group', 'massacre', 'shelling',
];

const BUILTIN_RSS_SOURCES = [
  { name: 'The Guardian World',    url: 'https://www.theguardian.com/world/rss' },
  { name: 'Sky News World',        url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
  { name: 'France 24 English',     url: 'https://www.france24.com/en/rss' },
  { name: 'Deutsche Welle Africa', url: 'https://rss.dw.com/rdf/rss-en-africa' },
  { name: 'RFI English',           url: 'https://www.rfi.fr/en/rss' },
  { name: 'Middle East Eye',       url: 'https://www.middleeasteye.net/rss' },
  { name: 'UN News Peace',         url: 'https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/feed/rss.xml' },
  { name: 'ReliefWeb',             url: 'https://reliefweb.int/updates/rss.xml' },
  { name: 'Crisis Group',          url: 'https://www.crisisgroup.org/rss.xml' },
  { name: 'ISW',                   url: 'https://www.understandingwar.org/feeds/all.xml' },
  { name: 'Bellingcat',            url: 'https://www.bellingcat.com/feed/' },
  { name: 'Oryx',                  url: 'https://www.oryxspioenkop.com/feeds/posts/default' },
  { name: 'OSINTdefender',         url: 'https://rsshub.app/telegram/channel/osintdefender' },
  { name: 'Intel Slava Z',         url: 'https://rsshub.app/telegram/channel/intelslava' },
];

function buildGdeltQuery(conflict) {
  const nameTerms = conflict.name
    .split(/[-\s]+/)
    .filter(w => w.length > 3 && !CONFLICT_TYPE_WORDS.has(w.toLowerCase()))
    .map(w => `"${w}"`);
  const countryTerms = conflict.countries_involved.length > 1
    ? conflict.countries_involved.map(c => `"${c}"`)
    : [];
  const allTerms = [...new Set([...nameTerms, ...countryTerms])];
  return `theme:WAR_CONFLICT sourcelang:english (${allTerms.join(' OR ')})`;
}

async function fetchGdelt(query, maxRecords = 25) {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${maxRecords}&timespan=7d&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles ?? []).map(a => ({ title: a.title ?? '', link: a.url ?? '', pubDate: a.seendate ?? '' }));
}

async function fetchRss(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GlobalConflictDashboard/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const items = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  return (Array.isArray(items) ? items : [items]).map(item => ({
    title: item.title?.['#text'] ?? item.title ?? '',
    link: item.link?.['@_href'] ?? item.link ?? '',
    description: item.description ?? item.summary?.['#text'] ?? item.summary ?? '',
    pubDate: item.pubDate ?? item.published ?? item.updated ?? '',
  }));
}

async function getAcledToken() {
  const clientId = process.env.ACLED_CLIENT_ID;
  const clientSecret = process.env.ACLED_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  try {
    const res = await fetch('https://api.acleddata.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'client_credentials' }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token ?? null;
  } catch { return null; }
}

async function fetchAcledEvents(countries, token) {
  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const results = [];
  for (const country of countries) {
    try {
      const params = new URLSearchParams({
        country,
        event_date: `${sinceStr}|${todayStr}`,
        event_date_where: 'BETWEEN',
        fields: 'event_id_cnty,event_date,event_type,sub_event_type,actor1,actor2,country,location,latitude,longitude,fatalities,notes',
        limit: '100',
      });
      const res = await fetch(`https://api.acleddata.com/acled/read?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      results.push(...(data.data ?? []));
    } catch { /* skip */ }
  }
  return results;
}

function matchConflictStrict(title, body, conflicts) {
  const text = `${title} ${body}`.toLowerCase();
  if (!ARMED_CONFLICT_KEYWORDS.some(kw => text.includes(kw))) return null;
  for (const conflict of conflicts) {
    if (text.includes(conflict.name.toLowerCase())) return conflict.id;
    const specificTerms = conflict.name
      .split(/[-\s]+/)
      .filter(w => w.length > 4 && !CONFLICT_TYPE_WORDS.has(w.toLowerCase()));
    if (specificTerms.some(t => text.includes(t.toLowerCase()))) return conflict.id;
    if (conflict.countries_involved.length === 1) {
      if (text.includes(conflict.countries_involved[0].toLowerCase())) return conflict.id;
    } else {
      const matches = conflict.countries_involved.filter(c => text.includes(c.toLowerCase()));
      if (matches.length >= 2) return conflict.id;
    }
  }
  return null;
}

function parseGdeltDate(raw) {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function runIngest() {
  const supabase = createAnonClient();
  const serviceClient = createServiceClient();

  const [sourcesRes, conflictsRes] = await Promise.all([
    supabase.from('news_sources').select('*').eq('active', true),
    supabase.from('conflicts').select('id, name, type, countries_involved').neq('status', 'frozen'),
  ]);

  const dbSources = sourcesRes.data ?? [];
  const conflicts = conflictsRes.data ?? [];

  if (conflicts.length === 0) {
    return { inserted: 0, skipped: 0, acled_events: 0, message: 'No active conflicts found' };
  }

  const DEAD_SOURCE_PATTERNS = ['reuters.com', 'apnews.com'];
  const dbRss = dbSources
    .filter(s => s.type === 'rss')
    .filter(s => !DEAD_SOURCE_PATTERNS.some(p => s.url.includes(p)));
  const existingUrls = new Set(dbRss.map(s => s.url));
  const allRssSources = [...dbRss, ...BUILTIN_RSS_SOURCES.filter(s => !existingUrls.has(s.url))];

  const articles = [];

  await Promise.all(allRssSources.map(async (source) => {
    const items = await fetchRss(source.url).catch(() => []);
    for (const item of items) {
      if (!item.link || !item.title) continue;
      const conflictId = matchConflictStrict(item.title, item.description ?? '', conflicts);
      if (!conflictId) continue;
      articles.push({
        conflict_id: conflictId,
        headline: item.title,
        url: item.link,
        source: source.name,
        published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
        summary: item.description?.slice(0, 500) ?? '',
      });
    }
  }));

  const hasGdelt = dbSources.some(s => s.type === 'gdelt');
  if (hasGdelt) {
    for (const conflict of conflicts) {
      const query = buildGdeltQuery(conflict);
      const items = await fetchGdelt(query).catch(() => []);
      for (const item of items) {
        if (!item.link || !item.title) continue;
        articles.push({
          conflict_id: conflict.id,
          headline: item.title,
          url: item.link,
          source: 'GDELT',
          published_at: parseGdeltDate(item.pubDate ?? ''),
          summary: '',
        });
      }
    }
  }

  let acledEventsInserted = 0;
  const acledToken = await getAcledToken();
  if (acledToken) {
    for (const conflict of conflicts) {
      const events = await fetchAcledEvents(conflict.countries_involved, acledToken);
      if (events.length > 0) {
        const rows = events.map(e => ({
          conflict_id: conflict.id,
          acled_event_id: Number(e.event_id_cnty),
          event_date: e.event_date,
          event_type: e.event_type,
          sub_event_type: e.sub_event_type ?? null,
          actor1: e.actor1 ?? null,
          actor2: e.actor2 ?? null,
          country: e.country,
          location: e.location ?? null,
          latitude: e.latitude != null ? Number(e.latitude) : null,
          longitude: e.longitude != null ? Number(e.longitude) : null,
          fatalities: Number(e.fatalities ?? 0),
          notes: e.notes?.slice(0, 1000) ?? null,
        }));
        const { data: inserted } = await serviceClient
          .from('conflict_events')
          .upsert(rows, { onConflict: 'acled_event_id', ignoreDuplicates: true })
          .select('id');
        acledEventsInserted += inserted?.length ?? 0;

        const count = events.length;
        const avgFatalities = events.reduce((s, e) => s + Number(e.fatalities ?? 0), 0) / count;
        const status = count === 0 ? 'de-escalating' : count < 5 ? 'ongoing' : 'escalating';
        const intensity = avgFatalities > 10 ? 'high' : avgFatalities > 2 ? 'medium' : 'low';
        await serviceClient.from('conflicts').update({ status, intensity }).eq('id', conflict.id);
      }
    }
  }

  if (articles.length === 0) {
    return { inserted: 0, skipped: 0, acled_events: acledEventsInserted, message: 'No matching articles found' };
  }

  const candidateUrls = [...new Set(articles.map(a => a.url))];
  const { data: existing } = await supabase.from('news_items').select('url').in('url', candidateUrls);
  const seenUrls = new Set((existing ?? []).map(r => r.url));
  const newArticles = articles.filter(a => !seenUrls.has(a.url));

  if (newArticles.length === 0) {
    return { inserted: 0, skipped: articles.length, acled_events: acledEventsInserted, message: 'All articles already exist' };
  }

  const { data: insertedNews, error } = await serviceClient.from('news_items').insert(newArticles).select('id');
  if (error) throw new Error(error.message);

  return {
    inserted: insertedNews?.length ?? 0,
    skipped: articles.length - (insertedNews?.length ?? 0),
    acled_events: acledEventsInserted,
  };
}

function isAuthorized(req) {
  const secret = process.env.INGEST_SECRET;
  if (!secret) return true;
  return req.headers['x-ingest-secret'] === secret;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!isAuthorized(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const result = await runIngest();
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message ?? 'Internal server error' });
  }
};
