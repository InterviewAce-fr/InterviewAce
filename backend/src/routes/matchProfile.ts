import { Router, Request, Response } from 'express';

const router = Router();

/** Types partagés */
export type MatchItem = { questionId: string; score: number };
export type MatchProfile = {
  id?: string;
  overallScore: number;
  matches: MatchItem[];
  // ajoute ici d'autres champs si nécessaire
};

/**
 * Utilitaire: normalise l'entrée pour obtenir un tableau de profils.
 * - Si on reçoit un seul profil -> [profil]
 * - Si on reçoit déjà un tableau -> inchangé
 */
function toArrayProfiles(input: unknown): MatchProfile[] {
  if (Array.isArray(input)) return input as MatchProfile[];
  if (input && typeof input === 'object') return [input as MatchProfile];
  return [];
}

/**
 * Choisit le meilleur profil (par overallScore décroissant).
 * S'il n'y a pas de profils, renvoie un profil vide.
 */
function pickBestProfile(profiles: MatchProfile[]): MatchProfile {
  if (!profiles.length) {
    return { overallScore: 0, matches: [] };
  }
  const sorted = [...profiles].sort(
    (a, b) => (b.overallScore ?? 0) - (a.overallScore ?? 0)
  );
  return sorted[0];
}

/**
 * GET /match-profile (optionnel) — healthcheck
 */
router.get('/', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

/**
 * POST /match-profile
 * Body possible:
 * - { profile: MatchProfile }
 * - { profiles: MatchProfile[] }
 *
 * Réponse:
 * - { overallScore: number, matches: MatchItem[], profile?: MatchProfile }
 */
router.post('/', (req: Request, res: Response) => {
  const { profile, profiles } = req.body ?? {};

  const list = toArrayProfiles(profiles ?? profile);
  const best = pickBestProfile(list);

  // Sécurise les champs et évite l'accès sur un array par erreur
  const overallScore = typeof best.overallScore === 'number' ? best.overallScore : 0;
  const matches = Array.isArray(best.matches) ? best.matches : [];

  res.json({
    overallScore,
    matches,
    profile: best,
  });
});

export default router;
