// Supabase Edge Function: ingest-news
// Fetches RSS feeds, matches articles to conflicts, inserts into database
// Scheduled via pg_cron: every 4 hours

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { parseFeed } from 'https://deno.land/x/rss@1.0.0/mod.ts';

interface Conflict {
  id: string;
  name: string;
  slug: string;
  countries_involved: string[];
  metadata: Record<string, any>;
}

interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: string;
  region: string;
  language: string;
  active: boolean;
}

interface MatchedArticle {
  headline: string;
  url: string;
  source: string;
  published_at: string;
  summary: string;
  conflict_id: string | null;
  relevance_score: number;
}

// Conflict keyword matching configuration
// Each conflict has keywords to match against headlines
const CONFLICT_KEYWORDS: Record<string, { keywords: string[]; countries: string[] }> = {
  'ukraine-russia-conflict': {
    keywords: ['ukraine', 'russia', 'kyiv', 'moscow', 'zelensky', 'putin', 'donbas', 'donetsk', 'luhansk', 'kherson', 'zaporizhzhia', 'kharkiv', 'odessa', 'crimea', 'azov', 'mariupol', 'bakhmut', 'avdiivka'],
    countries: ['Ukraine', 'Russia'],
  },
  'gaza-israel-conflict': {
    keywords: ['gaza', 'israel', 'hamas', 'west bank', 'jerusalem', 'netanyahu', 'hezbollah', 'lebanon', 'iron dome', 'rafah', 'khan younis', 'al-aqsa', 'idf', 'gazan'],
    countries: ['Israel', 'Palestine', 'Lebanon'],
  },
  'sudan-civil-war': {
    keywords: ['sudan', 'khartoum', 'rsf', 'burhan', 'darfur', 'paramilitary', 'rapid support', 'sudanese armed forces', 'safe'],
    countries: ['Sudan', 'South Sudan'],
  },
  'myanmar-internal-conflict': {
    keywords: ['myanmar', 'burma', 'tatmadaw', 'junta', 'aung san suu kyi', 'rakhine', 'karen', 'kachin', 'chin', 'nug', 'pdf'],
    countries: ['Myanmar', 'Burma'],
  },
  'yemen-civil-war': {
    keywords: ['yemen', 'houthi', 'sanaa', 'aden', 'saudi-led', 'ansar allah', 'red sea', 'hodeidah', 'marib', 'taiz'],
    countries: ['Yemen', 'Saudi Arabia'],
  },
  'syrian-civil-war': {
    keywords: ['syria', 'assad', 'aleppo', 'damascus', 'idlib', 'sdf', 'kurdish', 'isis', 'islamic state', 'deir ez-zor', 'raqqa'],
    countries: ['Syria'],
  },
  'sahel-insurgency': {
    keywords: ['sahel', 'mali', 'burkina faso', 'niger', 'jihadist', 'islamist', 'barkhane', 'minusma', 'ecowas', 'jnim', 'isgs', 'mali armed'],
    countries: ['Mali', 'Burkina Faso', 'Niger', 'Chad', 'Mauritania'],
  },
  'kashmir-dispute': {
    keywords: ['kashmir', 'srinagar', 'line of control', 'loc', 'azad kashmir', 'article 370', 'pulwama', 'uri'],
    countries: ['India', 'Pakistan'],
  },
  'tigray-conflict': {
    keywords: ['tigray', 'ethiopia', 'abiy ahmed', 'mekelle', 'tplf', 'amhara', 'oromia', 'addis ababa'],
    countries: ['Ethiopia', 'Eritrea'],
  },
  'haiti-gang-violence': {
    keywords: ['haiti', 'port-au-prince', 'gang', 'g9', 'g-pep', 'ariel henry', 'transitional council', 'kenya police', 'caribbean'],
    countries: ['Haiti'],
  },
};

// News sources configuration (RSS feeds)
const RSS_SOURCES = [
  { name: 'BBC World', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', region: 'global' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', region: 'global' },
  { name: 'Reuters', url: 'https://www.reutersagency.com/feed/', region: 'global' },
  { name: 'Middle East Eye', url: 'https://www.middleeasteye.net/rss', region: 'middle_east' },
  { name: 'War on the Rocks', url: 'https://warontherocks.com/feed/', region: 'global' },
  { name: 'International Crisis Group', url: 'https://www.crisisgroup.org/rss.xml', region: 'global' },
  { name: 'RUSI', url: 'https://rusi.org/rss.xml', region: 'global' },
  { name: 'Chatham House', url: 'https://www.chathamhouse.org/rss.xml', region: 'global' },
  { name: 'Meduza', url: 'https://meduza.io/en/rss', region: 'europe' },
  { name: 'Bellingcat', url: 'https://www.bellingcat.com/feed/', region: 'global' },
  { name: 'Institute for the Study of War', url: 'https://www.understandingwar.org/rss.xml', region: 'global' },
  { name: 'ISS Africa', url: 'https://issafrica.org/rss.xml', region: 'africa' },
  { name: 'SWP Berlin', url: 'https://www.swp-berlin.org/en/rss.xml', region: 'europe' },
  { name: 'Texty.org.ua', url: 'https://texty.org.ua/feed/', region: 'europe' },
];

function matchArticleToConflict(headline: string, summary: string): { conflict_slug: string; score: number } | null {
  const text = `${headline} ${summary}`.toLowerCase();
  let bestMatch: { conflict_slug: string; score: number } | null = null;

  for (const [slug, config] of Object.entries(CONFLICT_KEYWORDS)) {
    let keywordMatches = 0;
    let countryMatches = 0;
    
    // Check keyword matches (must have at least 1)
    for (const keyword of config.keywords) {
      if (text.includes(keyword.toLowerCase())) {
        keywordMatches++;
      }
    }
    
    // Check country matches
    for (const country of config.countries) {
      if (text.includes(country.toLowerCase())) {
        countryMatches++;
      }
    }
    
    // Require at least 1 keyword match to avoid false positives
    // Country-only matches (e.g., "India" in non-Kashmir article) are ignored
    if (keywordMatches === 0) {
      continue;
    }
    
    // Calculate score: keywords are primary, countries boost the score
    let score = keywordMatches / config.keywords.length;
    if (countryMatches > 0) {
      score += 0.2; // Boost for country match
    }
    
    // Normalize to 0-1 range
    score = Math.min(score, 1.0);
    
    if (score > 0.15 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { conflict_slug: slug, score };
    }
  }

  return bestMatch;
}

async function fetchAndParseRSS(url: string): Promise<any[]> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'GlobalConflictDashboard/1.0' },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`);
      return [];
    }
    
    const xml = await response.text();
    const feed = await parseFeed(xml);
    
    return feed.entries?.map((entry: any) => ({
      headline: entry.title?.value || '',
      url: entry.links?.[0]?.href || '',
      published_at: entry.published ? new Date(entry.published).toISOString() : new Date().toISOString(),
      summary: entry.summary?.value || entry.description?.value || '',
    })) || [];
  } catch (error) {
    console.error(`Error parsing ${url}:`, error.message);
    return [];
  }
}

serve(async (req) => {
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all conflicts for matching
    const { data: conflicts, error: conflictsError } = await supabase
      .from('conflicts')
      .select('id, slug, name, countries_involved, metadata');

    if (conflictsError) {
      throw new Error(`Failed to fetch conflicts: ${conflictsError.message}`);
    }

    console.log(`Loaded ${conflicts?.length || 0} conflicts for matching`);

    // Fetch all RSS feeds in parallel
    const feedResults = await Promise.all(
      RSS_SOURCES.map(async (source) => {
        const articles = await fetchAndParseRSS(source.url);
        return articles.map((article) => ({
          ...article,
          source: source.name,
        }));
      })
    );

    const allArticles = feedResults.flat();
    console.log(`Fetched ${allArticles.length} total articles`);

    // Match articles to conflicts
    const matchedArticles: MatchedArticle[] = [];
    const unmatchedArticles: MatchedArticle[] = [];

    for (const article of allArticles) {
      const match = matchArticleToConflict(article.headline, article.summary);
      
      if (match && conflicts) {
        const conflict = conflicts.find((c: Conflict) => c.slug === match.conflict_slug);
        if (conflict) {
          matchedArticles.push({
            headline: article.headline,
            url: article.url,
            source: article.source,
            published_at: article.published_at,
            summary: article.summary,
            conflict_id: conflict.id,
            relevance_score: Math.round(match.score * 100) / 100,
          });
        }
      } else {
        unmatchedArticles.push({
          headline: article.headline,
          url: article.url,
          source: article.source,
          published_at: article.published_at,
          summary: article.summary,
          conflict_id: null,
          relevance_score: 0,
        });
      }
    }

    console.log(`Matched ${matchedArticles.length} articles to conflicts`);
    console.log(`Unmatched ${unmatchedArticles.length} articles`);

    // Insert matched articles into database
    let insertedCount = 0;
    let updatedCount = 0;

    for (const article of matchedArticles) {
      const { error: insertError } = await supabase
        .from('news_items')
        .upsert({
          conflict_id: article.conflict_id,
          headline: article.headline,
          url: article.url,
          source: article.source,
          published_at: article.published_at,
          summary: article.summary,
          relevance_score: article.relevance_score,
          fetched_at: new Date().toISOString(),
        }, {
          onConflict: 'url, published_at',
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error(`Failed to insert article: ${insertError.message}`);
      } else {
        insertedCount++;
      }
    }

    // Update last_news_update for affected conflicts
    const affectedConflictIds = [...new Set(matchedArticles.map(a => a.conflict_id).filter(Boolean))];
    
    for (const conflictId of affectedConflictIds) {
      await supabase
        .from('conflicts')
        .update({ last_news_update: new Date().toISOString() })
        .eq('id', conflictId);
    }

    // Log ingestion
    await supabase
      .from('ingestion_log')
      .insert({
        source_id: null, // bulk ingestion
        status: 'success',
        items_fetched: allArticles.length,
        items_new: insertedCount,
        items_updated: updatedCount,
        completed_at: new Date().toISOString(),
      });

    return new Response(JSON.stringify({
      success: true,
      total_fetched: allArticles.length,
      matched: matchedArticles.length,
      inserted: insertedCount,
      updated: updatedCount,
      unmatched: unmatchedArticles.length,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Ingestion failed:', error.message);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});