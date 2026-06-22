import { supabase } from '@/lib/supabase/client';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { XMLParser } from 'fast-xml-parser';

type NewsInsert = Database['public']['Tables']['news_items']['Insert'];

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Words that describe conflict type but are too generic to use as GDELT search terms
const CONFLICT_TYPE_WORDS = new Set([
  'civil', 'war', 'internal', 'conflict', 'dispute', 'insurgency',
  'violence', 'gang', 'crisis', 'tension', 'unrest',
]);

// Keywords that indicate an article is genuinely about armed conflict
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

// Hardcoded reliable English RSS sources that complement the database sources.
// Reuters and AP removed public RSS feeds in 2020 so the seed-data URLs are dead.
// All URLs below verified live as of 2025-06.
const BUILTIN_RSS_SOURCES = [
  // Global conflict reporting
  { name: 'The Guardian World',     url: 'https://www.theguardian.com/world/rss' },
  { name: 'Sky News World',         url: 'https://feeds.skynews.com/feeds/rss/world.xml' },
  // Strong Africa + Sahel + Haiti coverage
  { name: 'France 24 English',      url: 'https://www.france24.com/en/rss' },
  { name: 'Deutsche Welle Africa',  url: 'https://rss.dw.com/rdf/rss-en-africa' },
  { name: 'RFI English',            url: 'https://www.rfi.fr/en/rss' },
  // Strong Middle East coverage (Gaza, Yemen, Syria)
  { name: 'Middle East Eye',        url: 'https://www.middleeasteye.net/rss' },
  // Humanitarian + analyst reports (Haiti, Sahel, Sudan)
  { name: 'UN News Peace',          url: 'https://news.un.org/feed/subscribe/en/news/topic/peace-and-security/feed/rss.xml' },
  { name: 'ReliefWeb',              url: 'https://reliefweb.int/updates/rss.xml' },
  { name: 'Crisis Group',           url: 'https://www.crisisgroup.org/rss.xml' },
];

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
}

interface ConflictRow {
  id: string;
  name: string;
  type: string;
  countries_involved: string[];
}

// Build a targeted GDELT query.
// - theme:WAR_CONFLICT: GDELT's own classifier — only conflict-tagged articles
// - sourcelang:english: English articles only — eliminates German/Spanish results
// - Geographic terms extracted from the conflict name + country list
function buildGdeltQuery(conflict: ConflictRow): string {
  const nameTerms = conflict.name
    .split(/[-\s]+/)
    .filter(w => w.length > 3 && !CONFLICT_TYPE_WORDS.has(w.toLowerCase()))
    .map(w => `"${w}"`);

  // Include country names for multi-country conflicts (e.g. Sahel needs
  // "Mali" OR "Burkina Faso" OR "Niger" because "Sahel" alone is sparse)
  const countryTerms =
    conflict.countries_involved.length > 1
      ? conflict.countries_involved.map(c => `"${c}"`)
      : [];

  const allTerms = [...new Set([...nameTerms, ...countryTerms])];
  return `theme:WAR_CONFLICT sourcelang:english (${allTerms.join(' OR ')})`;
}

async function fetchRss(url: string): Promise<RssItem[]> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'GlobalConflictDashboard/1.0' },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const items: any[] = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];
  return (Array.isArray(items) ? items : [items]).map((item: any) => ({
    title: item.title?.['#text'] ?? item.title ?? '',
    link: item.link?.['@_href'] ?? item.link ?? '',
    description: item.description ?? item.summary?.['#text'] ?? item.summary ?? '',
    pubDate: item.pubDate ?? item.published ?? item.updated ?? '',
  }));
}

// timespan=7d: only return articles from the last 7 days — keeps results current.
// Deduplication on URL prevents re-inserting on each cron run.
async function fetchGdelt(query: string, maxRecords = 25): Promise<RssItem[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${maxRecords}&timespan=7d&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles ?? []).map((a: any) => ({
    title: a.title ?? '',
    link: a.url ?? '',
    pubDate: a.seendate ?? '',
  }));
}

function matchConflictStrict(
  title: string,
  body: string,
  conflicts: ConflictRow[]
): string | null {
  const text = `${title} ${body}`.toLowerCase();

  const hasConflictContext = ARMED_CONFLICT_KEYWORDS.some(kw => text.includes(kw));
  if (!hasConflictContext) return null;

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

function parseGdeltDate(raw: string): string {
  const m = raw.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

async function runIngest(): Promise<{ inserted: number; skipped: number; message?: string }> {
  const [sourcesRes, conflictsRes] = await Promise.all([
    supabase.from('news_sources').select('*').eq('active', true),
    supabase.from('conflicts').select('id, name, type, countries_involved').neq('status', 'frozen'),
  ]);

  const dbSources: any[] = sourcesRes.data ?? [];
  const conflicts: ConflictRow[] = (conflictsRes.data ?? []) as ConflictRow[];

  if (conflicts.length === 0) {
    return { inserted: 0, skipped: 0, message: 'No active conflicts found' };
  }

  // Merge database RSS sources with hardcoded reliable sources.
  // Filter out dead Reuters/AP entries (they no longer offer public RSS).
  const DEAD_SOURCE_PATTERNS = ['reuters.com', 'apnews.com'];
  const dbRss = dbSources
    .filter(s => s.type === 'rss')
    .filter(s => !DEAD_SOURCE_PATTERNS.some(p => s.url.includes(p)));
  const existingUrls = new Set(dbRss.map((s: any) => s.url));
  const allRssSources = [
    ...dbRss,
    ...BUILTIN_RSS_SOURCES.filter(s => !existingUrls.has(s.url)),
  ];

  const articles: NewsInsert[] = [];

  // ── RSS sources (parallel — different domains, no rate-limit concern) ─────
  await Promise.all(
    allRssSources.map(async (source) => {
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
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
          summary: item.description?.slice(0, 500) ?? '',
        });
      }
    })
  );

  // ── GDELT: sequential to avoid rate-limiting ──────────────────────────────
  // All 9 conflicts in parallel previously caused GDELT to throttle and return
  // nothing for less-prominent conflicts (Haiti, Sahel, etc.).
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

  if (articles.length === 0) {
    return { inserted: 0, skipped: 0, message: 'No matching articles found' };
  }

  // ── Deduplicate by URL ────────────────────────────────────────────────────
  const candidateUrls = [...new Set(articles.map(a => a.url))];
  const { data: existing } = await supabase
    .from('news_items')
    .select('url')
    .in('url', candidateUrls);
  const seenUrls = new Set((existing ?? []).map((r: any) => r.url));
  const newArticles = articles.filter(a => !seenUrls.has(a.url));

  if (newArticles.length === 0) {
    return { inserted: 0, skipped: articles.length, message: 'All articles already exist' };
  }

  const serviceClient = createServiceClient();
  // Type cast: hand-written database.types.ts lacks Relationships field required by supabase-js generics
  const { data: inserted, error } = await (serviceClient as any)
    .from('news_items')
    .insert(newArticles)
    .select('id');

  if (error) throw new Error(error.message);

  return {
    inserted: inserted?.length ?? 0,
    skipped: articles.length - (inserted?.length ?? 0),
  };
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.INGEST_SECRET;
  // If no secret is configured, allow all (dev / initial setup)
  if (!secret) return true;
  return request.headers.get('x-ingest-secret') === secret;
}

// GET — called by GitHub Actions cron every 3 hours
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runIngest();
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}

// POST — ad-hoc manual trigger
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runIngest();
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
