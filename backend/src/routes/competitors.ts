import { Router } from 'express';
import { generateCompetitors } from '../services/aiService.server';

const router = Router();

// POST /api/ai/competitors
router.post('/competitors', async (req, res) => {
  try {
    const { company_name, company_summary, limit } = req.body || {};
    const items = await generateCompetitors({ company_name, company_summary, limit });
    res.json({ items });
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'competitors error' });
  }
});

export default router;
