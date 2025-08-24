import { Router, Request, Response } from 'express';
import { generateWhySuggestions, MatchProfile, MatchItem } from '../services/aiService.server';

const router = Router();

/**
 * POST /why-suggestions
 * Body attendu:
 * - { profile: MatchProfile, limit?: number }
 * - ou bien { matches: MatchItem[], limit?: number } et on reconstruit un profil
 */
router.post('/', async (req: Request, res: Response) => {
  const { profile, matches, limit } = req.body ?? {};

  let normalizedProfile: MatchProfile | undefined = profile;

  if (!normalizedProfile && Array.isArray(matches)) {
    const overallScore =
      matches.reduce((acc: number, m: MatchItem) => acc + (m?.score ?? 0), 0) /
      (matches.length || 1);
    normalizedProfile = { overallScore, matches };
  }

  if (!normalizedProfile) {
    return res.status(400).json({
      error: 'Missing profile or matches in request body.',
    });
  }

  try {
    const suggestions = await generateWhySuggestions({
      profile: normalizedProfile,
      limit: typeof limit === 'number' ? limit : 5,
    });

    res.json({ suggestions });
  } catch (err) {
    // Évite d’exposer des détails sensibles
    res.status(500).json({ error: 'Failed to generate suggestions.' });
  }
});

export default router;
