import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

router.get("/conflicts", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    res.json({ data: [], meta: { total: 0, page: 1, limit: 20, has_more: false } });
    return;
  }

  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");
    const status = (req.query.status as string)?.split(",").filter(Boolean);
    const type = (req.query.type as string)?.split(",").filter(Boolean);
    const intensity = (req.query.intensity as string)?.split(",").filter(Boolean);
    const region = (req.query.region as string)?.split(",").filter(Boolean);
    const search = req.query.q as string;
    const sort = (req.query.sort as string) || "updated_at";
    const order = (req.query.order as string) || "desc";

    let query = supabase.from("conflicts").select("*", { count: "exact" });

    if (status?.length) query = query.in("status", status);
    if (type?.length) query = query.in("type", type);
    if (intensity?.length) query = query.in("intensity", intensity);
    if (region?.length) query = query.in("region", region);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);

    query = query.order(sort, { ascending: order === "asc" });

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({
      data: data || [],
      meta: {
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > from + (data?.length || 0),
      },
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/conflicts/:id", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    res.status(503).json({ error: "Supabase not configured" });
    return;
  }

  try {
    const { id } = req.params;

    const { data: conflict, error: conflictError } = await supabase
      .from("conflicts")
      .select("*")
      .eq("id", id)
      .single();

    if (conflictError || !conflict) {
      res.status(404).json({ error: "Conflict not found" });
      return;
    }

    const [{ data: conflictParties }, { data: conflictTags }, { data: latestNews }, { data: analysis }] =
      await Promise.all([
        supabase.from("conflict_parties").select("*, parties(*)").eq("conflict_id", id),
        supabase.from("conflict_tags").select("*, tags(*)").eq("conflict_id", id),
        supabase.from("news_items").select("*").eq("conflict_id", id).order("published_at", { ascending: false }).limit(10),
        supabase.from("analysis_links").select("*").eq("conflict_id", id).order("created_at", { ascending: false }),
      ]);

    res.json({
      ...conflict,
      parties: conflictParties || [],
      tags: (conflictTags as any[])?.map((ct: any) => ct.tags) || [],
      latest_news: latestNews || [],
      analysis: analysis || [],
      news_count: latestNews?.length || 0,
      parties_count: conflictParties?.length || 0,
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
