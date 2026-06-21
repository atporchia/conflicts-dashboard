import { supabase } from '@/lib/supabase/client';
import { NewsItem, PaginatedResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const conflictId = searchParams.get('conflict_id');
    const source = searchParams.get('source');

    let query = supabase
      .from('news_items')
      .select('*', { count: 'exact' });

    if (conflictId) {
      query = query.eq('conflict_id', conflictId);
    }

    if (source) {
      query = query.eq('source', source);
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