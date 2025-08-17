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

const BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, ''); // retire le / final
const api = (p: string) => `${BASE}${p.startsWith('/') ? '' : '/'}${p}`;

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Please log in to use this feature');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`
  };
}

class AIService {

  async analyzeJobFromUrl(_url: string): Promise<JobAnalysisResult> {
    // LinkedIn bloque le scraping. On garde l’API “url” mais on guide l’utilisateur.
    throw new Error(
      'L’analyse par URL est désactivée (LinkedIn bloque le scraping). Colle la description complète de l’offre.'
    );
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysisResult> {
    const headers = await authHeaders();
    const r = await fetch(api(`/api/ai/analyze-text`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ text: jobText })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to analyze job text');
    // Normalisation pour correspondre exactement aux types du front
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
    const r = await fetch(api(`/api/ai/analyze-cv-text`), {
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
    const r = await fetch(api(`/api/ai/match`), {
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
    const r = await fetch(api(`/api/ai/generate-answers`), {
      method: 'POST',
      headers,
      body: JSON.stringify({ jobData, cvData, questions })
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d?.error || 'Failed to generate answers');
    if (Array.isArray(d.answers)) return d.answers;
    return [];
  }
}

export const aiService = new AIService();
