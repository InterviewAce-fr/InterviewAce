import { Router } from 'express';
import { generateSWOT } from '../services/aiService.server';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/swot', requireAuth, async (req, res) => {
  try {
    const result = await generateSWOT({
      existing: req.body?.existing
    });
    res.json(result);
  } catch (e: any) {
    console.error('SWOT error', e);
    res.status(500).json({ error: e?.message || 'SWOT generation failed' });
  }
});

export default router;