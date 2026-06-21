import { supabase } from '@/lib/supabase/client';
import { Conflict, ConflictFilters, PaginatedResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status')?.split(',');
    const type = searchParams.get('type')?.split(',');
    const intensity = searchParams.get('intensity')?.split(',');
    const region = searchParams.get('region')?.split(',');
    const search = searchParams.get('q');
    const sort = searchParams.get('sort') || 'updated_at';
    const order = searchParams.get('order') || 'desc';

    // Build query
    let query = supabase
      .from('conflicts')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status && status.length > 0) {
      query = query.in('status', status);
    }
    if (type && type.length > 0) {
      query = query.in('type', type);
    }
    if (intensity && intensity.length > 0) {
      query = query.in('intensity', intensity);
    }
    if (region && region.length > 0) {
      query = query.in('region', region);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    query = query.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    const response: PaginatedResponse<Conflict> = {
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