/**
 * Service AI — version stable pour build Heroku/TS
 * - Fournit les types partagés (MatchItem, MatchProfile)
 * - Exporte toutes les fonctions utilisées dans les routes
 * - Typage explicite (pas de {})
 */

export type MatchItem = { questionId: string; score: number; rationale?: string };
export type MatchProfile = {
  id?: string;
  overallScore: number;
  matches: MatchItem[];
  // ajoute ici d'autres champs si nécessaire (ex: jobId, userId…)
};

/* ------------------------------------------------------------------ */
/* Utilitaires internes                                               */
/* ------------------------------------------------------------------ */

type Ranked = { id: string; value: number; rationale?: string };

function rankMatches(matches: MatchItem[]): Ranked[] {
  const ranked: Ranked[] = matches
    .filter((m) => m && typeof m.score === 'number' && typeof m.questionId === 'string')
    .map((m) => ({
      id: m.questionId,
      value: m.score,
      rationale: m.rationale,
    }))
    .sort((a, b) => b.value - a.value);

  return ranked;
}

/* ------------------------------------------------------------------ */
/* Why Suggestions                                                    */
/* ------------------------------------------------------------------ */

type GenerateWhyInput = {
  profile: MatchProfile;
  limit?: number;
};

export async function generateWhySuggestions(
  input: GenerateWhyInput
): Promise<string[]> {
  const limit = Math.max(1, Math.min(input?.limit ?? 5, 10));
  const profile = input?.profile;

  const score = typeof profile?.overallScore === 'number' ? profile.overallScore : 0;
  const ranked = rankMatches(Array.isArray(profile?.matches) ? profile!.matches : []);

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

  for (const t of top) {
    if (t.rationale && t.rationale.trim().length > 0) {
      base.push(`Sur Q${t.id}, ${t.rationale.trim()}`);
    }
  }

  base.push(
    `Mettez en avant 2–3 exemples chiffrés liés à vos meilleurs items pour ancrer ces points forts.`
  );

  return base.slice(0, limit);
}

/* ------------------------------------------------------------------ */
/* Exports génériques (utilisés ailleurs)                             */
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

/* ------------------------------------------------------------------ */
/* Stubs pour satisfaire toutes les routes                            */
/* Remplace par vraies implémentations IA plus tard                    */
/* ------------------------------------------------------------------ */

export async function generateBusinessModel(input: any): Promise<any> {
  return { message: 'Business model generated (stub)', input };
}

export async function generateCompanyHistory(input: any): Promise<any> {
  return { history: ['Founded 2000', 'IPO 2010', 'Acquisition 2020'], input };
}

export async function analyzeJobFromText(text: string): Promise<any> {
  return { summary: 'Job analysis result (stub)', text };
}

export async function generateSWOT(input: any): Promise<any> {
  return {
    strengths: ['Strong brand'],
    weaknesses: ['Limited presence'],
    opportunities: ['Growing market'],
    threats: ['Competition'],
    input,
  };
}

export async function getTopNewsServer(company: string): Promise<any> {
  return {
    news: [
      { title: 'Company launches new product', url: 'https://example.com/news' },
    ],
    company,
  };
}

export async function analyzeCVFromText(cvText: string): Promise<any> {
  return { parsed: true, cvText };
}
