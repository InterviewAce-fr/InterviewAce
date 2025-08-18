import { Router } from 'express';
import { generateSWOT } from '../services/aiService.server';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

router.post(
  '/swot',
  authenticateToken,
  async (req, res) => {
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