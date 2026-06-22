import { Router } from "express";
import { createClient } from "@supabase/supabase-js";

const router = Router();

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

router.get("/news", async (req, res) => {
  const supabase = getSupabase();
  if (!supabase) {
    res.json({ data: [], meta: { total: 0, page: 1, limit: 20, has_more: false } });
    return;
  }

  try {
    const page = parseInt((req.query.page as string) || "1");
    const limit = parseInt((req.query.limit as string) || "20");
    const conflictId = req.query.conflict_id as string;
    const country = req.query.country as string;
    const excludeFrozen = req.query.exclude_frozen === "true";

    let query = supabase.from("news_items").select("*", { count: "exact" });

    if (conflictId) {
      query = query.eq("conflict_id", conflictId);
    } else if (country || excludeFrozen) {
      let conflictQuery = supabase.from("conflicts").select("id");
      if (country) conflictQuery = conflictQuery.contains("countries_involved", [country]);
      if (excludeFrozen) conflictQuery = conflictQuery.neq("status", "frozen");

      const { data: conflicts } = await conflictQuery;
      if (conflicts && conflicts.length > 0) {
        const ids = conflicts.map((c: any) => c.id);
        query = query.in("conflict_id", ids);
      } else if (country) {
        res.json({ data: [], meta: { total: 0, page, limit, has_more: false } });
        return;
      }
    }

    query = query.order("published_at", { ascending: false });

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

export default router;
