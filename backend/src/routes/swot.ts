import { Router } from 'express';
import { generateSWOT } from '../services/aiService.server';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { supabase } from '../utils/supabase';

const router = Router();

router.post(
  '/swot',
  authenticateToken,
  async (req: AuthRequest, res) => {
  try {
    let company_summary: string | undefined = req.body?.company_summary;
    const preparation_id: string | undefined = req.body?.preparation_id;

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
        // ignore
      }
    }

    const result = await generateSWOT({
      company_name: req.body?.company_name,
      company_summary,
      existing: req.body?.existing
    });
    res.json(result);
  } catch (e: any) {
    console.error('SWOT error', e);
    res.status(500).json({ error: e?.message || 'SWOT generation failed' });
  }
});
export default router;
