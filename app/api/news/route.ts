import { supabase } from '@/lib/supabase/client';
import { NewsItem, PaginatedResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const conflictId = searchParams.get('conflict_id');
    const country = searchParams.get('country');

    let query = supabase
      .from('news_items')
      .select('*', { count: 'exact' });

    if (conflictId) {
      query = query.eq('conflict_id', conflictId);
    } else if (country) {
      // Join with conflicts to filter by country
      const { data: conflicts } = await supabase
        .from('conflicts')
        .select('id')
        .contains('countries_involved', [country]);
      
      if (conflicts && conflicts.length > 0) {
        const conflictIds = conflicts.map((c: any) => c.id);
        query = query.in('conflict_id', conflictIds);
      } else {
        // No conflicts in this country, return empty
        return Response.json({ data: [], meta: { total: 0, page, limit, has_more: false } });
      }
    }

    query = query.order('published_at', { ascending: false });

    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const response: PaginatedResponse<NewsItem> = {
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > from + (data?.length || 0),
      },
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}