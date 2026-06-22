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

// Keywords that indicate an article is genuinely about armed conflict (not just politics)
const ARMED_CONFLICT_KEYWORDS = [
  'killed', 'wounded', 'casualties', 'dead', 'deaths',
  'attack', 'attacked', 'airstrike', 'bombing', 'bomb', 'explosion',
  'military', 'troops', 'forces', 'soldiers', 'army',
  'fighting', 'battle', 'offensive', 'counteroffensive',
  'ceasefire', 'truce', 'surrender',
  'rebel', 'insurgent', 'militant', 'jihadist',
  'missile', 'rocket', 'artillery', 'drone strike',
  'invasion', 'occupation', 'siege',
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

// Build a targeted GDELT query using the WAR_CONFLICT theme tag plus
// the most specific geographic identifiers from the conflict name and countries.
function buildGdeltQuery(conflict: ConflictRow): string {
  // Pull meaningful words from the conflict name (drop generic conflict-type words)
  const nameTerms = conflict.name
    .split(/[-\s]+/)
    .filter(w => w.length > 3 && !CONFLICT_TYPE_WORDS.has(w.toLowerCase()))
    .map(w => `"${w}"`);

  // For multi-country conflicts (e.g. Sahel with Mali/Burkina Faso/Niger) the
  // countries are more searchable than the region name alone — include both.
  const countryTerms =
    conflict.countries_involved.length > 1
      ? conflict.countries_involved.map(c => `"${c}"`)
      : [];

  const allTerms = [...new Set([...nameTerms, ...countryTerms])];
  return `theme:WAR_CONFLICT (${allTerms.join(' OR ')})`;
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

async function fetchGdelt(query: string, maxRecords = 25): Promise<RssItem[]> {
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=${maxRecords}&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles ?? []).map((a: any) => ({
    title: a.title ?? '',
    link: a.url ?? '',
    pubDate: a.seendate ?? '',
  }));
}

// Strict RSS matching: an article must contain armed-conflict language AND
// either (a) the conflict name, or (b) multiple parties for multi-country
// conflicts, or (c) the single country for single-country conflicts.
function matchConflictStrict(
  title: string,
  body: string,
  conflicts: ConflictRow[]
): string | null {
  const text = `${title} ${body}`.toLowerCase();

  // Require at least one hard armed-conflict keyword — skip opinion, politics, economics
  const hasConflictContext = ARMED_CONFLICT_KEYWORDS.some(kw => text.includes(kw));
  if (!hasConflictContext) return null;

  for (const conflict of conflicts) {
    // Strongest signal: the conflict name itself is mentioned
    if (text.includes(conflict.name.toLowerCase())) return conflict.id;

    // For specific sub-regions (Tigray, Sahel, Kashmir, Gaza) check those words
    const specificTerms = conflict.name
      .split(/[-\s]+/)
      .filter(w => w.length > 4 && !CONFLICT_TYPE_WORDS.has(w.toLowerCase()));
    if (specificTerms.some(t => text.includes(t.toLowerCase()))) return conflict.id;

    // For single-country conflicts, the country mention + conflict context is enough
    if (conflict.countries_involved.length === 1) {
      if (text.includes(conflict.countries_involved[0].toLowerCase())) return conflict.id;
    } else {
      // Multi-country: require ≥2 of the involved countries to both appear
      const matches = conflict.countries_involved.filter(c => text.includes(c.toLowerCase()));
      if (matches.length >= 2) return conflict.id;
    }
  }
  return null;
}

function parseGdeltDate(raw: string): string {
  // GDELT format: 20240620T103000Z
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

  const sources: any[] = sourcesRes.data ?? [];
  const conflicts: ConflictRow[] = (conflictsRes.data ?? []) as ConflictRow[];

  if (sources.length === 0 || conflicts.length === 0) {
    return { inserted: 0, skipped: 0, message: 'No sources or conflicts found' };
  }

  const articles: NewsInsert[] = [];

  // ── RSS sources ──────────────────────────────────────────────────────────
  const rssSources = sources.filter(s => s.type === 'rss');
  await Promise.all(
    rssSources.map(async (source) => {
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

  // ── GDELT: one targeted query per conflict ───────────────────────────────
  const gdeltSource = sources.find(s => s.type === 'gdelt');
  if (gdeltSource) {
    await Promise.all(
      conflicts.map(async (conflict) => {
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
      })
    );
  }

  if (articles.length === 0) {
    return { inserted: 0, skipped: 0, message: 'No matching articles found' };
  }

  // ── Deduplicate by URL ───────────────────────────────────────────────────
  const candidateUrls = [...new Set(articles.map(a => a.url))];
  const { data: existing } = await supabase
    .from('news_items')
    .select('url')
    .in('url', candidateUrls);
  const existingUrls = new Set((existing ?? []).map((r: any) => r.url));
  const newArticles = articles.filter(a => !existingUrls.has(a.url));

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

// GET — called by Vercel Cron every 3 hours
export async function GET() {
  try {
    const result = await runIngest();
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}

// POST — available for ad-hoc manual trigger if needed
export async function POST() {
  try {
    const result = await runIngest();
    return Response.json(result);
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
