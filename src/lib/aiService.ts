import { supabase } from './supabase';

export interface JobAnalysisResult {
  company_name: string;
  job_title: string;
  responsibilities: string[];
  required_profile: string[];
  job_description: string;
}

export interface CVAnalysisResult {
  skills: string[];
  experience: string[];
  education: string[];
  achievements: string[];
  person?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
}

export interface MatchAnalysisResult {
  overall_score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

export interface SWOTResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const api = (p: string) => `${BASE}${p.startsWith('/') ? '' : '/'}${p}`;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please log in to use this feature');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

export interface BusinessModelData {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

export interface MatchingResultsFront {
  overallScore: number;
  matches: Array<{
    targetType: 'requirement' | 'responsibility';
    targetIndex: number;
    targetText: string;

    skill: string;
    grade: 'High' | 'Moderate' | 'Low';
    score: number;
    reasoning: string;
  }>;
  distribution: { high: number; moderate: number; low: number };
}

class AIService {

  async analyzeJobFromUrl(_url: string): Promise<JobAnalysisResult> {
    throw new Error(
      'L’analyse par URL est désactivée (LinkedIn bloque le scraping). Colle la description complète de l’offre.'
    );
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysisResult> {
    const headers = await authHeaders();
    const r = await fetch(api(`/ai/analyze-text`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: jobText })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to analyze job text');
    return {
      company_name: d.company_name || 'Unknown Company',
      job_title: d.job_title || 'Unknown Position',
      responsibilities: Array.isArray(d.responsibilities) ? d.responsibilities : [],
      required_profile: Array.isArray(d.required_profile) ? d.required_profile : [],
      job_description: d.job_description || jobText
    };
  }

  async analyzeCVFromText(cvText: string): Promise<CVAnalysisResult> {
    const headers = await authHeaders();
    const r = await fetch(api(`/ai/analyze-cv-text`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: cvText })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to analyze CV');
    return {
      skills: Array.isArray(d.skills) ? d.skills : [],
      experience: Array.isArray(d.experience) ? d.experience : [],
      education: Array.isArray(d.education) ? d.education : [],
      achievements: Array.isArray(d.achievements) ? d.achievements : [],
      person: d.person || {}
    };
  }

  async analyzeMatch(jobData: JobAnalysisResult, cvData: CVAnalysisResult): Promise<MatchAnalysisResult> {
    const headers = await authHeaders();
    const r = await fetch(api(`/ai/match`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobData, cvData })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to analyze match');
    return {
      overall_score: typeof d.overall_score === 'number' ? d.overall_score : 0,
      strengths: Array.isArray(d.strengths) ? d.strengths : [],
      gaps: Array.isArray(d.gaps) ? d.gaps : [],
      recommendations: Array.isArray(d.recommendations) ? d.recommendations : []
    };
  }

  async generateInterviewAnswers(jobData: JobAnalysisResult, cvData: CVAnalysisResult, questions: string[]): Promise<string[]> {
    const headers = await authHeaders();
    const r = await fetch(api(`/ai/generate-answers`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobData, cvData, questions })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to generate answers');
    if (Array.isArray(d.answers)) return d.answers;
    return [];
  }

  async generateSWOT(input: {
    company_name?: string;
    existing?: SWOTResult;
  }): Promise<SWOTResult> {
    const headers = await authHeaders();
    const r = await fetch(api(`/ai/swot`), {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to generate SWOT');
    return {
      strengths: Array.isArray(d.strengths) ? d.strengths : [],
      weaknesses: Array.isArray(d.weaknesses) ? d.weaknesses : [],
      opportunities: Array.isArray(d.opportunities) ? d.opportunities : [],
      threats: Array.isArray(d.threats) ? d.threats : []
    };
  }

  async generateBusinessModel(input: {
    company_name?: string;
    existing?: BusinessModelData;
  }): Promise<BusinessModelData> {
    const headers = await authHeaders();
    const r = await fetch(api(`/ai/business-model`), {
      method: 'POST',
      headers,
      body: JSON.stringify(input)
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to generate Business Model');
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

  // Step 4 — matching avec ancrage par ligne (targetType/targetIndex/targetText)
  async matchProfile(payload: {
    requirements: string[];
    responsibilities: string[];
    education: string[];
    experience: string[];
    skills: string[];
  }): Promise<MatchingResultsFront> {
    const headers = await authHeaders();
    const r = await fetch(api('/ai/match-profile'), {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Match API error');

    const matches = Array.isArray(d.matches) ? d.matches.map((m: any) => ({
      // ✅ champs d’ancrage renvoyés par le backend
      targetType: (m?.targetType === 'responsibility' ? 'responsibility' : 'requirement') as 'requirement' | 'responsibility',
      targetIndex: Number.isFinite(Number(m?.targetIndex)) ? Number(m?.targetIndex) : 0,
      targetText: String(m?.targetText ?? ''),

      // scoring
      skill: String(m?.skill ?? '—'),
      grade: ((): 'High' | 'Moderate' | 'Low' => {
        const g = String(m?.grade ?? '').toLowerCase();
        if (g.startsWith('high')) return 'High';
        if (g.startsWith('moder')) return 'Moderate';
        if (g.startsWith('low')) return 'Low';
        const s = Number(m?.score ?? 0);
        if (s >= 75) return 'High';
        if (s >= 50) return 'Moderate';
        return 'Low';
      })(),
      score: Math.max(0, Math.min(100, Math.round(Number(m?.score ?? 0)))),
      reasoning: String(m?.reasoning ?? ''),
    })) : [];

    const distribution = matches.reduce(
      (acc, m) => {
        if (m.score >= 75) acc.high++;
        else if (m.score >= 50) acc.moderate++;
        else acc.low++;
        return acc;
      },
      { high: 0, moderate: 0, low: 0 }
    );

    return {
      overallScore: typeof d.overallScore === 'number' ? d.overallScore : 0,
      matches,
      distribution,
    };
  }

  // Step 5 — suggestions why questions
  async generateWhySuggestions(cv: any, job: any, matches: any, swotAndBmc: any) {
    const headers = await authHeaders();

    const r = await fetch(api('/why-suggestions'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ cv, job, matches, swotAndBmc }),
    });

    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to generate why suggestions');

    return d;
  }
}

export const aiService = new AIService();
