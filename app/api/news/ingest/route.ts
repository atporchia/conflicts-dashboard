import { supabase } from '@/lib/supabase/client';
import { createServiceClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { XMLParser } from 'fast-xml-parser';

type NewsInsert = Database['public']['Tables']['news_items']['Insert'];

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

interface RssItem {
  title?: string;
  link?: string;
  description?: string;
  pubDate?: string;
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

async function fetchGdelt(conflictName: string, maxRecords = 10): Promise<RssItem[]> {
  const query = encodeURIComponent(conflictName);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=${maxRecords}&format=json`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.articles ?? []).map((a: any) => ({
    title: a.title ?? '',
    link: a.url ?? '',
    description: a.seendate ?? '',
    pubDate: a.seendate ?? '',
  }));
}

function matchConflict(
  text: string,
  conflicts: { id: string; name: string; countries_involved: string[] }[]
): string | null {
  const lower = text.toLowerCase();
  for (const conflict of conflicts) {
    if (lower.includes(conflict.name.toLowerCase())) return conflict.id;
    for (const country of conflict.countries_involved) {
      if (lower.includes(country.toLowerCase())) return conflict.id;
    }
  }
  return null;
}

export async function POST() {
  try {
    // Load active sources and non-frozen conflicts
    const [sourcesRes, conflictsRes] = await Promise.all([
      supabase.from('news_sources').select('*').eq('active', true),
      supabase.from('conflicts').select('id, name, countries_involved').neq('status', 'frozen'),
    ]);

    const sources: any[] = sourcesRes.data ?? [];
    const conflicts: any[] = conflictsRes.data ?? [];

    if (sources.length === 0 || conflicts.length === 0) {
      return Response.json({ inserted: 0, skipped: 0, message: 'No sources or conflicts found' });
    }

    const articles: NewsInsert[] = [];

    // Fetch from RSS sources
    const rssSources = sources.filter(s => s.type === 'rss');
    await Promise.all(
      rssSources.map(async (source) => {
        const items = await fetchRss(source.url).catch(() => []);
        for (const item of items) {
          if (!item.link || !item.title) continue;
          const text = `${item.title} ${item.description ?? ''}`;
          const conflictId = matchConflict(text, conflicts);
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
      })
    );

    // Fetch from GDELT for each conflict
    const gdeltSource = sources.find(s => s.type === 'gdelt');
    if (gdeltSource) {
      await Promise.all(
        conflicts.map(async (conflict) => {
          const items = await fetchGdelt(conflict.name).catch(() => []);
          for (const item of items) {
            if (!item.link || !item.title) continue;
            articles.push({
              conflict_id: conflict.id,
              headline: item.title,
              url: item.link,
              source: 'GDELT',
              published_at: item.pubDate
                ? new Date(
                    item.pubDate.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
                  ).toISOString()
                : new Date().toISOString(),
              summary: '',
            });
          }
        })
      );
    }

    if (articles.length === 0) {
      return Response.json({ inserted: 0, skipped: 0, message: 'No matching articles found' });
    }

    // Deduplicate: skip URLs already in the database
    const candidateUrls = [...new Set(articles.map(a => a.url))];
    const { data: existing } = await supabase
      .from('news_items')
      .select('url')
      .in('url', candidateUrls);
    const existingUrls = new Set((existing ?? []).map((r: any) => r.url));
    const newArticles = articles.filter(a => !existingUrls.has(a.url));

    if (newArticles.length === 0) {
      return Response.json({ inserted: 0, skipped: articles.length, message: 'All articles already exist' });
    }

    const serviceClient = createServiceClient();
    // Type cast needed: hand-written database.types.ts lacks Relationships, causing supabase-js to infer Insert as never
    const { data: inserted, error } = await (serviceClient as any)
      .from('news_items')
      .insert(newArticles)
      .select('id');

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({
      inserted: inserted?.length ?? 0,
      skipped: articles.length - (inserted?.length ?? 0),
    });
  } catch (err: any) {
    return Response.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
