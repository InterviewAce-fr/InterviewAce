// src/routes/topNews.ts
import { Router } from "express";
import { getTopNewsServer } from "../services/aiService.server"; // ⬅️ corriger ce chemin
import { callLLM } from "../llm/callLLM";    

const router = Router();

// la route finale sera /api/ai/top-news
router.post("/top-news", async (req, res) => {
  const t0 = Date.now();
  try {
    const { company_name, months = 18, limit = 3 } = req.body || {};
    const data = await getTopNewsServer({ company_name, months, limit, callLLM });
    console.log('[top-news] ok', { company_name, n: data?.length ?? 0, ms: Date.now() - t0 });
    res.json(Array.isArray(data) ? data : []);
  } catch (e: any) {
    console.error('[top-news] error', e);
    // réponse "douce" côté client pour éviter spinner infini
    res.status(200).json([]);  // <- plutôt que 400
  }
});

export default router;
