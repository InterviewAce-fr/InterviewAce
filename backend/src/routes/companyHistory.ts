// src/routes/companyHistory.ts
import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';
import { generateCompanyHistory } from '../services/aiService.server';

const router = Router();

/**
 * POST /api/ai/company-history
 * body: { company_name: string, preparation_id?: string, company_summary?: string, limit?: number }
 */
router.post('/company-history', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { company_name, preparation_id, limit = 8 } = req.body || {};
    if (!company_name || typeof company_name !== 'string' || company_name.trim().length === 0) {
      return res.status(400).json({ error: 'company_name is required' });
    }

    let company_summary: string | undefined = req.body?.company_summary;
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
        // continue without summary
      }
    }

    const result = await generateCompanyHistory({
      company_name,
      company_summary,
      limit: Math.max(5, Math.min(12, Number(limit) || 8)),
    });

    return res.json(result);
  } catch (e: any) {
    console.error('[company-history] error', e);
    res.status(500).json({ error: e?.message || 'Company History generation failed' });
  }
});

export default router;
