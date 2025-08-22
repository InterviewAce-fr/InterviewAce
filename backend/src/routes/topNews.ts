// src/routes/topNews.ts
import { Router } from "express";
import { getTopNewsServer } from "../services/aiService.server"; // ⬅️ corriger ce chemin
import { callLLM } from "../llm/callLLM";    

const router = Router();

// la route finale sera /api/ai/top-news
router.post("/top-news", async (req, res) => {
  try {
    const { company_name, months = 18, limit = 3 } = req.body || {};
    const data = await getTopNewsServer({
      company_name,
      months,
      limit,
      callLLM,
    });
    res.json(data);
  } catch (e: any) {
    // ⬇️ return JSON, not plain text
    res.status(400).json({ error: e?.message || "Failed to get top news" });
  }
});

export default router;
