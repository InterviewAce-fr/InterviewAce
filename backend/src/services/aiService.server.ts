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
Scoring rules:
- For each key requirement, match against (education + experience + skills).
- For each key responsibility, match against (experience + skills).
- Score: 0–100 (100 = perfect fit).
- Grade: High (>=75), Moderate (50–74), Low (<50).
- Provide a concise, factual reasoning (1–2 sentences).
- Compute overallScore as a weighted average: requirements 60%, responsibilities 40%.
Return exactly this JSON shape:
{"overallScore":0,"matches":[{"skill":"","grade":"High|Moderate|Low","score":0,"reasoning":""}], "distribution":{"high":0,"moderate":0,"low":0}}`;

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
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const matchesRaw = Array.isArray(parsed.matches) ? parsed.matches : [];
  const matches: MatchResult[] = matchesRaw.map((m: any): MatchResult => {
    const score = clamp(toInt(m?.score ?? 0));
    const gradeFromScore = score >= 75 ? 'High' : score >= 50 ? 'Moderate' : 'Low';
    let grade = String(m?.grade ?? '').toLowerCase();
    if (grade.startsWith('high')) grade = 'High';
    else if (grade.startsWith('moder')) grade = 'Moderate';
    else if (grade.startsWith('low')) grade = 'Low';
    else grade = gradeFromScore;

    return {
      skill: String(m?.skill ?? m?.source ?? m?.target ?? '—'),
      grade: grade as MatchResult['grade'],
      score,
      reasoning: String(m?.reasoning ?? '')
    };
  });

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
