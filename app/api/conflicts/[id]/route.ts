import { supabase } from '@/lib/supabase/client';
import { ConflictWithDetails } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conflictId } = await params;

    // Fetch conflict
    const { data: conflict, error: conflictError } = await supabase
      .from('conflicts')
      .select('*')
      .eq('id', conflictId)
      .single();

    if (conflictError || !conflict) {
      return Response.json({ error: 'Conflict not found' }, { status: 404 });
    }

    // Fetch parties
    const { data: conflictParties } = await supabase
      .from('conflict_parties')
      .select('*, parties(*)')
      .eq('conflict_id', conflictId);

    // Fetch tags
    const { data: conflictTags } = await supabase
      .from('conflict_tags')
      .select('*, tags(*)')
      .eq('conflict_id', conflictId);

    // Fetch latest news
    const { data: latestNews } = await supabase
      .from('news_items')
      .select('*')
      .eq('conflict_id', conflictId)
      .order('published_at', { ascending: false })
      .limit(10);

    // Fetch analysis links
    const { data: analysis } = await supabase
      .from('analysis_links')
      .select('*')
      .eq('conflict_id', conflictId)
      .order('created_at', { ascending: false });

    const response: ConflictWithDetails = {
      ...(conflict as any),
      parties: conflictParties || [],
      tags: (conflictTags as any)?.map((ct: any) => ct.tags) || [],
      latest_news: latestNews || [],
      analysis: analysis || [],
      news_count: latestNews?.length || 0,
      parties_count: conflictParties?.length || 0,
    };

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}