import { Router } from 'express';
import { generateBusinessModel } from '../services/aiService.server';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/business-model', authenticateToken, async (req, res) => {
  try {
    const result = await generateBusinessModel({
      company_name: req.body?.company_name,
      existing: req.body?.existing
    });
    res.json(result);
  } catch (e: any) {
    console.error('BMC error', e);
    res.status(500).json({ error: e?.message || 'Business Model generation failed' });
  }
});

export default router;