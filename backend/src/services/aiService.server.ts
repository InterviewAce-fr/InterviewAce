import OpenAI from 'openai';
import { subMonths, differenceInMonths } from 'date-fns';
import { z } from 'zod';
import { XMLParser } from 'fast-xml-parser';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ------------------------------------------------------------------ */
/* Utilities                                                          */
/* ------------------------------------------------------------------ */
const clamp = (n: number, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const toInt = (n: any) => Number.isFinite(Number(n)) ? Math.round(Number(n)) : 0;

/* ------------------------------------------------------------------ */
/* Common helper                                                      */
/* ------------------------------------------------------------------ */
function withTimeout<T>(p: Promise<T>, ms: number, label = 'timeout'): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(label)), ms);
    p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
  });
}

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

/* ------------------------------------------------------------------ */
/* Step 3 — Top News (server)                                         */
/* ------------------------------------------------------------------ */

type RawHit = { title: string; url: string; snippet?: string; date?: string; source?: string };

const topNewsOutSchema = z.object({
  items: z.array(z.object({
    title: z.string(),
    summary: z.string(),
    date: z.string().optional().default(''),
    url: z.string().url(),
    source: z.string().optional(),
    category: z.string().optional(),
  }))
});

// Normalisation & dédup (titres proches)
function normalizeTitle(s: string) {
  return (s || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}
function isNearDuplicate(a: RawHit, b: RawHit) {
  const na = normalizeTitle(a.title);
  const nb = normalizeTitle(b.title);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const shorter = na.length < nb.length ? na : nb;
  const longer = na.length < nb.length ? nb : na;
  return shorter.length > 20 && longer.includes(shorter);
}

// --- Provider: NewsAPI.org ---
async function newsSearchWithNewsAPI({ q, sinceISO, limit }: { q: string; sinceISO: string; limit: number }): Promise<RawHit[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key) return [];
  const from = sinceISO.slice(0, 10);
  const url = new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q', q);
  url.searchParams.set('from', from);
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('language', 'en');
  url.searchParams.set('pageSize', String(Math.min(Math.max(limit, 1), 100)));

  const r = await fetch(url.toString(), { headers: { 'X-Api-Key': key } });
  if (!r.ok) return [];
  const d: any = await r.json();
  const articles: any[] = Array.isArray(d?.articles) ? d.articles : [];
  return articles.map(a => ({
    title: a?.title || '',
    url: a?.url || '',
    snippet: a?.description || a?.content || '',
    date: a?.publishedAt || '',
    source: a?.source?.name || '',
  })).filter(x => x.title && x.url);
}

// --- Provider: Google News RSS (gratuit, pas de clé) ---
async function newsSearchWithGoogleNewsRSS(
  { q, sinceISO, limit }: { q: string; sinceISO: string; limit: number }
): Promise<RawHit[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const fetchP = fetch(url, {
      headers: { 'User-Agent': 'InterviewAceBot/1.0', 'Accept': 'application/rss+xml,text/xml,*/*' },
    });

    // ⏱️ coupe court si Google News est lent
    const r = await withTimeout(fetchP, 4000, 'rss_fetch_timeout');
    if (!r.ok) return [];
    const xml = await r.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const feed = parser.parse(xml);
    const items = feed?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) return [];

    const sinceTs = new Date(sinceISO).getTime();
    const take = Math.max(limit * 10, 40);

    const hits: RawHit[] = items.slice(0, take).map((it: any) => {
      const title = String(it?.title || '').trim();
      const url = String(it?.link || '').trim();
      const rawDesc = String(it?.description || '');
      const snippet = rawDesc.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      const date = String(it?.pubDate || '').trim();
      const srcText = (it?.source?.['#text'] ?? it?.source) as string | undefined;
      return { title, url, snippet, date, source: srcText || 'Google News' };
    }).filter(x => x.title && x.url);

    // filtre fenêtre temporelle
    return hits.filter(h => {
      const t = new Date(h.date || '').getTime();
      return Number.isFinite(t) ? (t >= sinceTs) : true;
    });
  } catch {
    return [];
  }
}

// --- Provider: Bing Web Search v7 ---
async function newsSearchWithBing({ q, sinceISO, limit }: { q: string; sinceISO: string; limit: number }): Promise<RawHit[]> {
  const key = process.env.BING_SEARCH_V7_KEY;
  if (!key) return [];
  const url = new URL('https://api.bing.microsoft.com/v7.0/search');
  url.searchParams.set('q', q);
  url.searchParams.set('count', String(Math.min(Math.max(limit, 1), 50)));
  url.searchParams.set('responseFilter', 'News,Webpages');
  url.searchParams.set('mkt', 'en-US');

  const r = await fetch(url.toString(), { headers: { 'Ocp-Apim-Subscription-Key': key } });
  if (!r.ok) return [];
  const d: any = await r.json();

  const hits: RawHit[] = [];

  const news = d?.news?.value ?? d?.value ?? [];
  if (Array.isArray(news)) {
    for (const n of news) {
      hits.push({
        title: n?.name || '',
        url: n?.url || '',
        snippet: n?.description || '',
        date: n?.datePublished || n?.datePublishedFreshnessText || '',
        source: n?.provider?.[0]?.name || 'Bing News',
      });
    }
  }

  const web = d?.webPages?.value ?? [];
  if (Array.isArray(web)) {
    for (const w of web) {
      hits.push({
        title: w?.name || '',
        url: w?.url || '',
        snippet: w?.snippet || '',
        date: w?.dateLastCrawled || '',
        source: 'Web',
      });
    }
  }

  return hits.filter(x => x.title && x.url);
}

// --- Sélection du provider ---
// --- Sélection du provider (avec fallback gratuit) ---
async function newsSearch(
  { q, sinceISO, limit }: { q: string; sinceISO: string; limit: number }
): Promise<RawHit[]> {
  const cap = Math.max(limit, 30);

  // lance tout en parallèle, chacun avec son timeout dédié
  const tasks = [
    (async () => {
      try { return await withTimeout(newsSearchWithNewsAPI({ q, sinceISO, limit: cap }), 3500, 'newsapi_timeout'); }
      catch { return []; }
    })(),
    (async () => {
      try { return await withTimeout(newsSearchWithBing({ q, sinceISO, limit: cap }), 3500, 'bing_timeout'); }
      catch { return []; }
    })(),
    (async () => {
      try { return await newsSearchWithGoogleNewsRSS({ q, sinceISO, limit: cap }); } // déjà time-outé dedans
      catch { return []; }
    })(),
  ];

  const settled = await Promise.allSettled(tasks);
  // prends le premier non-vide dans l’ordre: NewsAPI, Bing, RSS
  for (const s of settled) {
    if (s.status === 'fulfilled' && Array.isArray(s.value) && s.value.length) {
      return s.value;
    }
  }
  // sinon concatène tout ce qui a répondu (même vide) — au cas où
  const all: RawHit[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled' && Array.isArray(s.value)) all.push(...s.value);
  }
  return all;
}

// --- Fonction principale exportée (appelée par la route /api/ai/top-news) ---
export async function getTopNewsServer({
  company_name,
  months = 18,
  limit = 3,
  callLLM,
}: {
  company_name: string;
  months?: number;
  limit?: number;
  callLLM: (prompt: string, opts?: { json?: boolean }) => Promise<any>;
}) {
  if (!company_name) throw new Error('company_name is required');
  months = Math.min(Math.max(months, 1), 36);
  limit = Math.min(Math.max(limit, 1), 5);

  const sinceISO = subMonths(new Date(), months).toISOString();

  // 1) Recherche
  const q = `"${company_name}" (funding OR partnership OR acquisition OR launch OR product OR earnings OR leadership OR investigation OR lawsuit OR expansion)`;
  const raw = await newsSearch({ q, sinceISO, limit: 40 });

  // 2) Fenêtre temporelle
  const withinWindow = raw.filter(r => {
    if (!r.date) return true;
    const d = new Date(r.date);
    return Number.isFinite(d.getTime()) ? differenceInMonths(new Date(), d) <= months : true;
  });

  // 3) Dédup (titre/url + near-duplicate)
  const seen = new Set<string>();
  const dedup: RawHit[] = [];
  for (const h of withinWindow) {
    const key = `${normalizeTitle(h.title)}|${h.url}`;
    if (seen.has(key)) continue;
    if (!dedup.some(d => isNearDuplicate(d, h))) {
      seen.add(key);
      dedup.push(h);
    }
  }
  if (dedup.length === 0) return [];

  // 4) Sélection via LLM (thèmes distincts)
  const toolInput = JSON.stringify({
    company_name,
    window_months: months,
    sinceISO,
    candidates: dedup.slice(0, 40),
    need: limit,
  });

  const prompt = `
You are selecting the TOP ${limit} distinct pieces of company news for interview preparation.
Rules:
- Each pick MUST represent a different theme (funding, product launch, partnership, legal, earnings, leadership, expansion, etc.).
- Prefer high-impact, authoritative sources (company newsroom, filings, tier-1 outlets).
- If multiple links describe the same event, pick the most authoritative & recent one.
Return STRICT JSON OBJECT:
{
  "items": [
    { "title": "", "summary": "<=80 words, factual", "date": "ISO if known", "url": "https://...", "source": "Publisher", "category": "theme" }
  ]
}
INPUT:
${toolInput}
`.trim();

  let llmOut: any;
  try {
    llmOut = await withTimeout(callLLM(prompt, { json: true }), 6000, 'llm_timeout');
  } catch {
    // Fallback simple
    return dedup.slice(0, limit).map(h => ({
      title: h.title,
      summary: h.snippet || '',
      date: h.date || '',
      url: h.url,
      source: h.source || '',
      category: undefined,
    }));
  }

  // 5) Normalisation
  let normalized: any;
  if (Array.isArray(llmOut)) {
    normalized = { items: llmOut };
  } else if (llmOut && typeof llmOut === 'object' && 'items' in llmOut) {
    normalized = llmOut;
  } else if (typeof llmOut === 'string') {
    try {
      const parsed = JSON.parse(llmOut);
      normalized = Array.isArray(parsed) ? { items: parsed } : parsed;
    } catch {
      throw new Error('LLM output parsing failed');
    }
  } else {
    throw new Error('LLM output parsing failed');
  }

  const parsed = topNewsOutSchema.safeParse(normalized);
  if (!parsed.success) throw new Error('LLM output parsing failed');

  // 6) Tri par date (desc) et tranche
  return parsed.data.items
    .slice(0, limit)
    .sort((a, b) => (new Date(b.date || 0).getTime() || 0) - (new Date(a.date || 0).getTime() || 0));
}

/* ------------------------------------------------------------------ */
/* Step 2 — Company Timeline (NEW)                                    */
/* ------------------------------------------------------------------ */
/**
 * Génère une frise chronologique compacte (6–10 jalons) au format JSON strict.
 * Sortie: { items: ["YYYY – évènement", ...] }
 */
export async function generateCompanyTimeline(payload: {
  company_name?: string;
  company_summary?: string;
  limit?: number;
}): Promise<string[]> {
  const { company_name, company_summary, limit = 10 } = payload || {};

  const systemPrompt = `Return STRICT JSON with exactly:
{"items":["YYYY – label"]}

Rules:
- 6–10 bullets, French.
- Each string MUST start with YYYY (or YYYY-MM), then " – ", then a short label (no extra punctuation).
- Focus on founding, funding, launches, acquisitions/M&A, pivots, IPO, notable partnerships, key leadership changes.
- Use company_name / company_summary if provided for disambiguation.
- No markdown, no extra text, no explanations.`;

  const userContent = {
    company_name: company_name ?? null,
    company_summary: company_summary ?? null,
    max: Math.max(6, Math.min(10, limit))
  };

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 700,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContent) }
    ]
  });

  let parsed: any = {};
  try { parsed = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}'); } catch { parsed = {}; }
  const items = Array.isArray(parsed.items) ? parsed.items : [];
  return items
    .map((s: any) => String(s || '').trim())
    .filter(Boolean)
    .slice(0, userContent.max);
}
