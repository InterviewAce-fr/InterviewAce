// charge .env avant tout
import 'dotenv/config';

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
function normalizeTitle(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function isNearDuplicate(a: { title: string }, b: { title: string }) {
  const ta = normalizeTitle(a.title);
  const tb = normalizeTitle(b.title);
  if (ta === tb) return true;
  return ta.includes(tb) || tb.includes(ta);
}
async function withTimeout<T>(p: Promise<T>, ms: number, tag = 'timeout'): Promise<T> {
  let t: any;
  const timeout = new Promise<T>((_, rej) => (t = setTimeout(() => rej(new Error(tag)), ms)));
  try {
    const out = await Promise.race([p, timeout]);
    clearTimeout(t);
    // @ts-ignore
    return out;
  } catch (e) {
    clearTimeout(t);
    throw e;
  }
}

/* ------------------------------------------------------------------ */
/* CV                                                                 */
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
{"company_name":"","job_title":"","required_profile":[],"responsibilities":[],"company_summary":""}
Rules:
- "company_summary" is a concise, neutral paragraph (<= 120 words) describing the company (what it does, market, geographies, key products/segments).`;
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
    responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
    company_summary: typeof parsed.company_summary === 'string' ? parsed.company_summary : ''
  };
}

/* ------------------------------------------------------------------ */
/* Step 2 — SWOT                                                      */
/* ------------------------------------------------------------------ */
export async function generateSWOT(payload: {
  company_name?: string;
  company_summary?: string;
  existing?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
}) {
  const { company_name, company_summary, existing } = payload || {};

  const systemPrompt = `Return strict JSON with exactly these keys.
{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]}
Rules:
- Arrays only. 3–8 concise bullet strings per array.
- No markdown, numbers, or emojis, just short phrases.
- Take into account the company name if provided, and the optional company summary context, to contextualize the SWOT
- If 'existing' contains items, complement them (avoid duplicates, add missing angles).`;

  const userContent = {
    company_name: company_name ?? null,
    company_summary: company_summary ?? null,
    existing: existing ?? null
  };

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContent) }
    ]
  });
  const d = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');

  const arr = (x: any) => (Array.isArray(x) ? x : []);
  return {
    strengths: arr(d.strengths),
    weaknesses: arr(d.weaknesses),
    opportunities: arr(d.opportunities),
    threats: arr(d.threats)
  };
}

/* ------------------------------------------------------------------ */
/* Step 3 — Business Model Canvas                                     */
/* ------------------------------------------------------------------ */
export async function generateBusinessModel(payload: {
  company_name?: string;
  company_summary?: string;
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
  const { company_name, company_summary, existing } = payload || {};

  const systemPrompt = `Return strict JSON with exactly these keys.
{"keyPartners":[],"keyActivities":[],"keyResources":[],"valuePropositions":[],"customerRelationships":[],"channels":[],"customerSegments":[],"costStructure":[],"revenueStreams":[]}
Rules:
- Arrays only. 3–8 bullets per key.
- No markdown or numbering, just short phrases.
- Factor in the company name and (if provided) the company summary for context.
- If 'existing' contains items, complement them (avoid duplicates, add missing angles).`;

  const userContent = {
    company_name: company_name ?? null,
    company_summary: company_summary ?? null,
    existing: existing ?? null
  };

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
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
export type MatchProfile = {
  targetType: 'requirement'|'responsibility';
  targetIndex: number;
  targetText: string;
  skill: string;
  grade: 'High'|'Moderate'|'Low';
  score: number;
  reasoning: string;
};

export async function matchProfile(input: MatchProfileInput) {
  const { requirements, responsibilities, education, experience, skills } = input || {};
  const reqs = Array.isArray(requirements) ? requirements : [];
  const resps = Array.isArray(responsibilities) ? responsibilities : [];

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
  - Always provide a one-sentence reasoning.

  Return a JSON array of objects with fields:
  { "targetType": "...", "targetIndex":0, "targetText":"", "skill":"", "grade":"High|Moderate|Low", "score":0, "reasoning":"" }`;

  const user = JSON.stringify({
    requirements: reqs,
    responsibilities: resps,
    education: Array.isArray(education) ? education : [],
    experience: Array.isArray(experience) ? experience : [],
    skills: Array.isArray(skills) ? skills : []
  });

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  let content = resp.choices?.[0]?.message?.content ?? '[]';
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map((m: any) => ({
        targetType: (m?.targetType === 'requirement' || m?.targetType === 'responsibility') ? m.targetType : 'requirement',
        targetIndex: toInt(m?.targetIndex),
        targetText: String(m?.targetText ?? ''),
        skill: String(m?.skill ?? ''),
        grade: String(m?.grade ?? 'Low'),
        score: clamp(toInt(m?.score)),
        reasoning: String(m?.reasoning ?? ''),
      })) as MatchProfile[];
    }
  } catch {}
  return [];
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

// --- helpers for news search ---
async function rssSearch({ q, sinceISO }: { q: string; sinceISO: string }): Promise<RawHit[]> {
  try {
    const url = `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
    const r = await fetch(url);
    const xml = await r.text();
    const p = new XMLParser();
    const parsed = p.parse(xml);
    const items = parsed?.rss?.channel?.item ?? [];
    const hits: RawHit[] = items.map((it: any) => ({
      title: String(it?.title ?? ''),
      url: String(it?.link ?? ''),
      date: String(it?.pubDate ?? ''),
      source: String(it?.source ?? '') || (String(it?.title ?? '').split(' - ').pop() ?? '')
    }));
    // filtre fenêtre temporelle
    const sinceTs = new Date(sinceISO).getTime();
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
  const url = new URL('https://api.bing.microsoft.com/v7.0/news/search');
  url.searchParams.set('q', q);
  url.searchParams.set('count', String(limit));
  url.searchParams.set('freshness', 'Month');
  const r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key }});
  const d = await r.json();
  const items = Array.isArray(d?.value) ? d.value : [];
  return items.map((it: any) => ({
    title: String(it?.name ?? ''),
    url: String(it?.url ?? ''),
    date: String(it?.datePublished ?? ''),
    source: String(it?.provider?.[0]?.name ?? '')
  }));
}

async function newsSearch({ q, sinceISO, limit }: { q: string; sinceISO: string; limit: number }): Promise<RawHit[]> {
  // combine light providers
  const a = await rssSearch({ q, sinceISO }).catch(() => []);
  const b = await newsSearchWithBing({ q, sinceISO, limit: limit * 2 }).catch(() => []);
  return [...a, ...b].slice(0, limit * 4);
}

export async function getTopNewsServer({
  company_name,
  company_summary,
  months = 18,
  limit = 3,
  callLLM,
}: {
  company_name: string;
  company_summary?: string;
  months?: number;
  limit?: number;
  callLLM: (prompt: string, opts?: { json?: boolean }) => Promise<any>;
}) {
  if (!company_name) throw new Error('company_name is required');
  months = Math.min(Math.max(months, 1), 36);
  limit = Math.min(Math.max(limit, 1), 5);

  const sinceISO = subMonths(new Date(), months).toISOString();

  // 1) Recherche
  const q = `"${company_name}" (funding OR partnership OR acquisition OR product OR launch OR legal OR earnings OR leadership OR investigation OR lawsuit OR expansion)`;
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
    company_summary,
    window_months: months,
    sinceISO,
    candidates: dedup.slice(0, 40),
    need: limit,
  });

  const prompt = `
You are selecting the TOP ${limit} distinct pieces of company news for interview preparation.
Rules:
- Each pick MUST represent a different theme (funding, product launch, partnership, legal, earnings, leadership, expansion, etc.).
- Use the provided company summary (if any) to disambiguate entities with the same name and prefer news about the correct company.
- Prefer high-impact, authoritative sources (company newsroom, filings, tier-1 outlets).
- If multiple links describe the same event, pick the most authoritative & recent one.
Return STRICT JSON OBJECT:
{
  "items": [
    { "title": "", "summary": "<=80 words, factual", "date": "ISO or YYYY-MM-DD", "url": "https://...", "source": "Publisher", "category": "theme" }
  ]
}
INPUT:
${toolInput}
`.trim();

  let llmOut: any;
  try {
    llmOut = await withTimeout(callLLM(prompt, { json: true }), 6000, 'llm_timeout');
  } catch {
    // tente une version non-json
    try {
      llmOut = await withTimeout(callLLM(prompt, { json: false }), 6000, 'llm_timeout2');
      if (typeof llmOut === 'string') {
        const m = llmOut.match(/\{[\s\S]*\}$/);
        if (m) llmOut = JSON.parse(m[0]);
      }
    } catch {}
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
    .map(it => ({
      title: it.title,
      summary: it.summary,
      date: it.date || '',
      url: it.url,
      source: it.source || '',
      category: it.category
    }));
}

/* ------------------------------------------------------------------ */
/* Step 2b — Company History (Timeline)                                */
/* ------------------------------------------------------------------ */
export async function generateCompanyHistory(payload: {
  company_name: string;
  company_summary?: string | null;
  limit?: number; // 5-12 key milestones
}) {
  const { company_name, company_summary, limit = 8 } = payload || {};
  if (!company_name) throw new Error('company_name is required');

  const systemPrompt = `Return STRICT JSON with exactly this shape:
{"timeline":[{"date":"","title":"","description":"","category":"","impact":""}]}
Rules:
- Provide ${Math.max(5, Math.min(12, Number(limit) || 8))} key milestones in chronological order (oldest first).
- Use ISO-like dates when known: "YYYY-MM-DD" if exact, otherwise "YYYY" or "YYYY-MM".
- "title" max 12 words. "description" max 40 words, factual and concise.
- Include a variety: founding, funding/rounds, IPO/delistings, landmark product launches, major partnerships, acquisitions/mergers, leadership changes, pivots, global expansions, legal/regulatory events.
- If uncertain, omit the field rather than guessing. No markdown or commentary.`;

  const userContent = {
    company_name,
    company_summary: company_summary ?? null,
    limit: Math.max(5, Math.min(12, Number(limit) || 8)),
  };

  const resp = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContent) },
    ],
  });

  let out: any = {};
  try {
    out = JSON.parse(resp.choices?.[0]?.message?.content ?? '{}');
  } catch {
    out = {};
  }

  const arr = (x: any) => (Array.isArray(x) ? x : []);
  return { timeline: arr(out.timeline).map((it: any) => ({
    date: String(it?.date ?? '').trim(),
    title: String(it?.title ?? '').trim(),
    description: String(it?.description ?? '').trim(),
    category: it?.category ? String(it.category) : undefined,
    impact: it?.impact ? String(it.impact) : undefined,
  })) };
}
