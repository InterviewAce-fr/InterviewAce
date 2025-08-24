/**
 * Service AI — version sûre pour build Heroku/TS
 * - Fournit les types partagés (MatchItem, MatchProfile)
 * - Exporte generateWhySuggestions
 * - Évite l’inférence `{}` en typant explicitement les structures
 */

export type MatchItem = { questionId: string; score: number; rationale?: string };
export type MatchProfile = {
  id?: string;
  overallScore: number;
  matches: MatchItem[];
  // ajoute ici d'autres champs si nécessaire (ex: jobId, userId…)
};

type GenerateWhyInput = {
  profile: MatchProfile;
  limit?: number;
};

/**
 * Utilitaire: transforme une liste de matches en liste triée avec valeur, en évitant
 * l'inférence `{}` -> on donne un type explicite.
 */
type Ranked = { id: string; value: number; rationale?: string };

function rankMatches(matches: MatchItem[]): Ranked[] {
  const ranked: Ranked[] = matches
    .filter((m) => m && typeof m.score === 'number' && typeof m.questionId === 'string')
    .map((m) => ({
      id: m.questionId,
      value: m.score,
      rationale: m.rationale,
    }))
    .sort((a, b) => b.value - a.value); // OK car `value` est typé

  return ranked;
}

/**
 * Génère des suggestions "Pourquoi vous ?" à partir d’un profil/matches.
 * Ici, on produit du texte déterministe (pas d’appel externe) pour fiabiliser le build.
 * Tu peux brancher ici ton LLM si besoin (OpenAI, etc.) — garde les types!
 */
export async function generateWhySuggestions(
  input: GenerateWhyInput
): Promise<string[]> {
  const limit = Math.max(1, Math.min(input?.limit ?? 5, 10));
  const profile = input?.profile;

  const score = typeof profile?.overallScore === 'number' ? profile.overallScore : 0;
  const ranked = rankMatches(Array.isArray(profile?.matches) ? profile!.matches : []);

  // Construis des suggestions courtes en s’appuyant sur les matches triés
  const top = ranked.slice(0, limit);

  const base: string[] = [];

  base.push(
    `Votre adéquation globale (${Math.round(score)}%) démontre une correspondance solide avec les exigences du poste.`
  );

  if (top.length) {
    base.push(
      `Vos points forts se distinguent sur ${top
        .map((t) => `Q${t.id} (${Math.round(t.value)}%)`)
        .join(', ')}.`
    );
  }

  // Ajoute des rationales si présentes
  for (const t of top) {
    if (t.rationale && t.rationale.trim().length > 0) {
      base.push(`Sur Q${t.id}, ${t.rationale.trim()}`);
    }
  }

  // Ajoute une suggestion d’action
  base.push(
    `Mettez en avant 2–3 exemples chiffrés liés à vos meilleurs items pour ancrer ces points forts.`
  );

  // Limite au nombre demandé
  return base.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Exemples d’autres exports stables (au cas où d’autres modules les importent)
   Ils ne font rien de sensible mais évitent des "import not found".
   Supprime/complète si tu as déjà des implémentations réelles.       */
/* ------------------------------------------------------------------ */

export async function pingAI(): Promise<'ok'> {
  return 'ok';
}

export function summarizeScores(profile: MatchProfile): { average: number } {
  const arr = Array.isArray(profile?.matches) ? profile.matches : [];
  const avg =
    arr.reduce((acc: number, m) => acc + (m?.score ?? 0), 0) / (arr.length || 1);
  return { average: avg };
}
