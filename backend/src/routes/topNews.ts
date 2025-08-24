// src/routes/topNews.ts
import { Router } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { getTopNewsServer } from "../services/aiService.server";
import { callLLM } from "../llm/callLLM";
import { supabase } from "../utils/supabase";

const router = Router();

// la route finale sera /api/ai/top-news
router.post("/top-news", authenticateToken, async (req: AuthRequest, res) => {
  const t0 = Date.now();
  try {
    const { company_name, months = 18, limit = 3, preparation_id, company_summary: cs } = req.body || {};
    let company_summary: string | undefined = cs;

    if (!company_summary && preparation_id) {
      try {
        const { data: prep } = await supabase
          .from('preparations')
          .select('step_1_data, user_id')
          .eq('id', preparation_id)
          .single();
        if (prep && prep.user_id === req.user!.id) {
          company_summary = prep.step_1_data?.company_summary || undefined;
        }
      } catch (e) {
        // proceed without summary
      }
    }

    const data = await getTopNewsServer({ company_name, company_summary, months, limit, callLLM });
    console.log('[top-news] ok', { company_name, n: data?.length ?? 0, ms: Date.now() - t0 });
    res.json(Array.isArray(data) ? data : []);
  } catch (e) {
    console.error('[top-news] error', e);
    res.status(200).json([]); // réponse douce: le front affiche "No major headlines found yet."
  }
});

export default router;
