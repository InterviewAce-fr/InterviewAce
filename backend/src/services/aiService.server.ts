import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const toInt = (n: any) => Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0;

/* ------------------------------------------------------------------ */
/* Step 1 — CV parsing                                                */
/* ------------------------------------------------------------------ */
export async function analyzeCVFromText(cvText: string) {
  const systemPrompt = `Return strict JSON:
{"skills":[],"experience":[],"education":[],"achievements":[],"person":{"name":"","email":"","phone":"","location":"","summary":""}}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: cvText }],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: 'json_object' }
  });
  return JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
}

/* ------------------------------------------------------------------ */
/* Step 1 — Job parsing                                               */
/* ------------------------------------------------------------------ */
export async function analyzeJobFromText(jobText: string) {
  const systemPrompt = `Return strict JSON (response_format enforce):
{"company_name":"","job_title":"","required_profile":[],"responsibilities":[]}`;
  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: jobText }
    ],
    temperature: 0,
    max_tokens: 1200,
    response_format: { type: 'json_object' }
  });

  const parsed = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
  return {
    company_name: parsed.company_name ?? '',
    job_title: parsed.job_title ?? '',
    required_profile: Array.isArray(parsed.required_profile) ? parsed.required_profile : [],
    responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : []
  };
}

/* ------------------------------------------------------------------ */
/* Step 2 — SWOT                                                      */
/* ------------------------------------------------------------------ */
export async function generateSWOT(payload: {
  company_name?: string;
  existing?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
}) {
  const { company_name, existing } = payload || {};

  const systemPrompt = `Return strict JSON with exactly these keys.
{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]}
Rules:
- Arrays only. 3–8 concise bullet strings per array.
- No markdown, numbers, or emojis, just short phrases.
- Take into account the company name if provided, to contextualize the SWOT
- If 'existing' contains items, complement them (avoid duplicates, add missing angles).`;

  const userContent = {
    company_name: company_name ?? null,
    existing: existing ?? null
  };

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContent) }
    ]
  });

  const parsed = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
  return {
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
    opportunities: Array.isArray(parsed.opportunities) ? parsed.opportunities : [],
    threats: Array.isArray(parsed.threats) ? parsed.threats : []
  };
}

/* ------------------------------------------------------------------ */
/* Step 3 — Business Model Canvas                                     */
/* ------------------------------------------------------------------ */
export async function generateBusinessModel(payload: {
  company_name?: string;
  existing?: {
    keyPartners?: string[];
    keyActivities?: string[];
    keyResources?: string[];
    valuePropositions?: string[];
    customerRelationships?: string[];
    channels?: string[];
    customerSegments?: string[];
    costStructure?: string[];
    revenueStreams?: string[];
  };
}) {
  const { company_name, existing } = payload || {};

  const systemPrompt = `Return strict JSON with exactly these keys.
{"keyPartners":[],"keyActivities":[],"keyResources":[],"valuePropositions":[],"customerRelationships":[],"channels":[],"customerSegments":[],"costStructure":[],"revenueStreams":[]}
Rules:
- Arrays only. 3–8 concise bullet strings per array.
- No markdown, numbers, or emojis, just short phrases.
- Use the company name if provided to contextualize likely partners, channels, segments, etc.
- If 'existing' contains items, complement them (avoid duplicates, add missing angles).`;

  const userContent = { company_name: company_name ?? null, existing: existing ?? null };

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.4,
    max_tokens: 1200,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContent) }
    ]
  });

  const d = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
  const arr = (x: any) => (Array.isArray(x) ? x : []);
  return {
    keyPartners: arr(d.keyPartners),
    keyActivities: arr(d.keyActivities),
    keyResources: arr(d.keyResources),
    valuePropositions: arr(d.valuePropositions),
    customerRelationships: arr(d.customerRelationships),
    channels: arr(d.channels),
    customerSegments: arr(d.customerSegments),
    costStructure: arr(d.costStructure),
    revenueStreams: arr(d.revenueStreams)
  };
}

/* ------------------------------------------------------------------ */
/* Step 4 — Profile Matching                                          */
/* ------------------------------------------------------------------ */

export type MatchProfileInput = {
  requirements: string[];
  responsibilities: string[];
  education: string[];
  experience: string[];
  skills: string[];
};

export type MatchResult = {
  targetType: 'requirement' | 'responsibility';
  targetIndex: number; // index in the corresponding list
  targetText: string;

  // scoring payload
  skill: string;
  grade: 'High' | 'Moderate' | 'Low';
  score: number;          // 0..100
  reasoning: string;
};

export type MatchingResults = {
  overallScore: number;   // 0..100
  matches: MatchResult[];
  distribution: { high: number; moderate: number; low: number };
};

export async function matchProfile(input: MatchProfileInput): Promise<MatchingResults> {
  // Prompt EN
  const system = `You are an expert talent screener.
  Compare a candidate profile against a job description and output STRICT JSON only (no extra text). 

  Matching rules:
  - For each key requirement, match it against (education + experience + skills) and produce ONE best match entry with a score.
  - For each key responsibility, match it against (experience + skills) and produce ONE best match entry with a score.
  - Each match MUST identify its target using:
    - "targetType": "requirement" | "responsibility"
    - "targetIndex": integer index within the provided array for that target type
    - "targetText": the exact text of the target at that index

  Scoring rules:
  - Score: 0–100 (100 = perfect fit).
  - Grade: High (>=75), Moderate (50–74), Low (<50).
  - Provide a concise, factual reasoning (1–2 sentences).
  - Compute overallScore as a weighted average: requirements 60%, responsibilities 40%.

  Return EXACTLY this JSON shape:
  {
    "overallScore": 0,
    "matches": [
      {
        "targetType":"requirement|responsibility",
        "targetIndex": 0,
        "targetText": "",
        "skill": "",
        "grade": "High|Moderate|Low",
        "score": 0,
        "reasoning": ""
      }
    ],
    "distribution": { "high":0, "moderate":0, "low":0 }
  }`;

  const userPayload = {
    instructions: {
      weights: { requirements: 0.6, responsibilities: 0.4 },
      thresholds: { high: 75, moderate: 50 }
    },
    data: input
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: JSON.stringify(userPayload) }
    ],
    max_tokens: 1400
  });

  const raw = completion.choices?.[0]?.message?.content ?? '{}';
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  const matchesRaw = Array.isArray(parsed.matches) ? parsed.matches : [];

  const matches: MatchResult[] = matchesRaw.map((m: any): MatchResult => {
    // sanitize target fields
    const tType = String(m?.targetType ?? '').toLowerCase();
    const targetType: 'requirement' | 'responsibility' =
      tType === 'responsibility' ? 'responsibility' : 'requirement';

    const targetIndex = Number.isFinite(Number(m?.targetIndex))
      ? Math.max(0, Math.round(Number(m.targetIndex)))
      : 0;

    const targetText = String(m?.targetText ?? '');

    // scoring
    const score = clamp(toInt(m?.score ?? 0));
    const gradeFromScore = score >= 75 ? 'High' : score >= 50 ? 'Moderate' : 'Low';
    let grade = String(m?.grade ?? '').toLowerCase();
    if (grade.startsWith('high')) grade = 'High';
    else if (grade.startsWith('moder')) grade = 'Moderate';
    else if (grade.startsWith('low')) grade = 'Low';
    else grade = gradeFromScore;

    return {
      targetType,
      targetIndex,
      targetText,
      skill: String(m?.skill ?? m?.source ?? m?.target ?? '—'),
      grade: grade as MatchResult['grade'],
      score,
      reasoning: String(m?.reasoning ?? '')
    };
  });

  // Distribution recomputed server-side (defensive)
  const distribution = matches.reduce(
    (acc, m) => {
      if (m.score >= 75) acc.high += 1;
      else if (m.score >= 50) acc.moderate += 1;
      else acc.low += 1;
      return acc;
    },
    { high: 0, moderate: 0, low: 0 }
  );

  const overallScore = clamp(toInt(parsed.overallScore ?? 0));

  return {
    overallScore,
    matches,
    distribution
  };
}

/* ------------------------------------------------------------------ */
/* Step 5 — Why Suggestion                                            */
/* ------------------------------------------------------------------ */

export async function generateWhySuggestions(payload: {
  cv: { skills: string[]; education: string[]; experience: string[] };
  job: { requirements: string[]; responsibilities: string[]; [k: string]: any };
  matches?: { overallScore?: number; matches?: any[] };
  swotAndBmc?: {
    strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[];
    bmc?: {
      valuePropositions?: string[]; customerSegments?: string[];
      keyActivities?: string[]; keyResources?: string[]; channels?: string[];
    };
  };
}) {
  // 🔒 Sortie attendue: JSON strict
  const system = `
Return STRICT JSON with exactly these keys and string values:
{
  "whyCompany": "",
  "whyRole": "",
  "whyYou": ""
}
Guidelines:
- Write concise, specific, high-signal answers (3–6 sentences each).
- No bullet points, no markdown, no emojis, no lists.
- Use concrete details from inputs (e.g., responsibilities, requirements, top skills, SWOT opportunities, BMC value propositions/channels/segments).
- Show credibility with tiny evidence (impact, metrics, relevant skills).
- Avoid generic platitudes (“passionate”, “fast learner”) unless tied to evidence.
- If inputs appear French, answer in French; otherwise answer in English.
- Do not include any preambles or explanations. Output valid JSON only.
`;

  // Construit un objet utilisateur compact pour le prompt
  const userPayload = {
    job: {
      title: payload.job?.job_title ?? payload.job?.title ?? null,
      company: payload.job?.company_name ?? payload.job?.company ?? null,
      requirements: payload.job?.requirements ?? [],
      responsibilities: payload.job?.responsibilities ?? [],
      description: payload.job?.job_description ?? null
    },
    cv: {
      skills: payload.cv?.skills ?? [],
      education: payload.cv?.education ?? [],
      experience: payload.cv?.experience ?? []
    },
    matches: payload.matches ?? null,
    swot: {
      strengths: payload.swotAndBmc?.strengths ?? [],
      weaknesses: payload.swotAndBmc?.weaknesses ?? [],
      opportunities: payload.swotAndBmc?.opportunities ?? [],
      threats: payload.swotAndBmc?.threats ?? []
    },
    bmc: payload.swotAndBmc?.bmc ?? null
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    max_tokens: 900,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: JSON.stringify(userPayload) }
    ]
  });

  // Parse défensif
  const raw = completion.choices?.[0]?.message?.content ?? "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch { parsed = {}; }

  const str = (v: any) => (typeof v === "string" ? v.trim() : "");
  const fallbackWhyCompany =
    userPayload.swot.opportunities?.[0]
      ? `Je suis motivé par l’opportunité autour de ${userPayload.swot.opportunities[0]}, en lien direct avec mon expérience et l’impact que je peux apporter.`
      : `Je suis réellement aligné avec votre mission et votre trajectoire, et je vois une forte cohérence avec mon parcours.`;

  const topSkill =
    (userPayload.matches?.matches?.[0]?.skill) ||
    (userPayload.cv.skills?.[0]) ||
    "mes compétences clés";

  const fallbackWhyRole =
    `Le rôle s’aligne sur mes forces (ex. ${topSkill}) et les responsabilités que j’apprécie, avec une contribution directe aux priorités de l’équipe.`;

  const fallbackWhyYou =
    `Vous devriez me recruter pour mes forces en ${userPayload.cv.skills?.slice(0,3).join(", ") || topSkill} et mon historique de résultats mesurables.`;

  return {
    whyCompany: str(parsed.whyCompany) || fallbackWhyCompany,
    whyRole:    str(parsed.whyRole)    || fallbackWhyRole,
    whyYou:     str(parsed.whyYou)     || fallbackWhyYou
  };
}