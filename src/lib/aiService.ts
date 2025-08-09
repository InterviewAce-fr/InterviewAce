import { supabase } from './supabase';

export interface JobAnalysis {
  company_name: string;
  job_title: string;
  required_profile: string[];
  responsibilities: string[];
  key_skills: string[];
  experience_level: string;
  location: string;
  salary_range?: string;
}

export interface CVAnalysis {
  skills: string[];
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    responsibilities: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
  certifications: string[];
  languages: string[];
}

export interface MatchAnalysis {
  overall_score: number;
  skill_match: {
    score: number;
    matched_skills: string[];
    missing_skills: string[];
  };
  experience_match: {
    score: number;
    relevant_experience: string[];
    gaps: string[];
  };
  recommendations: string[];
}

class AIService {
  private openaiApiKey: string | null = null;

  constructor() {
    // Get OpenAI API key from environment variables
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  private async callOpenAI(messages: any[], model: string = 'gpt-4') {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content;
  }

  async analyzeJobFromUrl(url: string): Promise<JobAnalysis> {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to use URL analysis');
      }

      // First scrape the job URL through the backend
      const scrapeResponse = await fetch('/api/scrape/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!scrapeResponse.ok) {
        throw new Error('Failed to scrape job URL. Try copying the job description text instead.');
      }

      const scrapeData = await scrapeResponse.json();
      return await this.analyzeJobFromText(scrapeData.content);
    } catch (error) {
      console.error('URL analysis error:', error);
      throw new Error('URL analysis failed. Please try using the job text mode instead.');
    }
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysis> {
    const prompt = `Analyze this job posting and extract key information. Return a JSON object with the following structure:

{
  "company_name": "Company name",
  "job_title": "Job title",
  "required_profile": ["requirement 1", "requirement 2", ...],
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "key_skills": ["skill 1", "skill 2", ...],
  "experience_level": "Junior/Mid/Senior",
  "location": "Location",
  "salary_range": "Salary range if mentioned"
}

Job posting:
${jobText}

Return only the JSON object, no additional text.`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert job analyst. Extract structured information from job postings and return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('Job analysis error:', error);
      throw new Error('Failed to analyze job posting. Please check your OpenAI API key and try again.');
    }
  }

  async analyzeCVFromText(cvText: string): Promise<CVAnalysis> {
    const prompt = `Analyze this CV/resume and extract key information. Return a JSON object with the following structure:

{
  "skills": ["skill 1", "skill 2", ...],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "duration": "Duration (e.g., 2020-2022)",
      "responsibilities": ["responsibility 1", "responsibility 2", ...]
    }
  ],
  "education": [
    {
      "institution": "University/School name",
      "degree": "Degree name",
      "year": "Graduation year"
    }
  ],
  "certifications": ["certification 1", "certification 2", ...],
  "languages": ["language 1", "language 2", ...]
}

CV/Resume:
${cvText}

Return only the JSON object, no additional text.`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert CV analyst. Extract structured information from resumes and return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('CV analysis error:', error);
      throw new Error('Failed to analyze CV. Please check your OpenAI API key and try again.');
    }
  }

  async analyzeMatch(jobAnalysis: JobAnalysis, cvAnalysis: CVAnalysis): Promise<MatchAnalysis> {
    const prompt = `Analyze the match between this job posting and candidate profile. Return a JSON object with the following structure:

{
  "overall_score": 85,
  "skill_match": {
    "score": 80,
    "matched_skills": ["skill 1", "skill 2", ...],
    "missing_skills": ["missing skill 1", "missing skill 2", ...]
  },
  "experience_match": {
    "score": 90,
    "relevant_experience": ["relevant experience 1", "relevant experience 2", ...],
    "gaps": ["gap 1", "gap 2", ...]
  },
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Job Requirements:
${JSON.stringify(jobAnalysis, null, 2)}

Candidate Profile:
${JSON.stringify(cvAnalysis, null, 2)}

Return only the JSON object, no additional text.`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert recruiter. Analyze job-candidate matches and provide detailed scoring and recommendations. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      return parsed;
    } catch (error) {
      console.error('Match analysis error:', error);
      throw new Error('Failed to analyze match. Please check your OpenAI API key and try again.');
    }
  }

  async generateInterviewAnswers(jobAnalysis: JobAnalysis, cvAnalysis: CVAnalysis, questions: string[]): Promise<string[]> {
    const prompt = `Generate personalized interview answers based on the candidate's profile and job requirements.

Job Requirements:
${JSON.stringify(jobAnalysis, null, 2)}

Candidate Profile:
${JSON.stringify(cvAnalysis, null, 2)}

Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Return a JSON array of answers in the same order as the questions. Each answer should be 2-3 sentences and highlight relevant experience/skills from the candidate's profile.

Example format:
["Answer to question 1", "Answer to question 2", ...]

Return only the JSON array, no additional text.`;

    const messages = [
      {
        role: 'system',
        content: 'You are an expert interview coach. Generate personalized, compelling answers that highlight the candidate\'s strengths. Return only valid JSON.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    try {
      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Interview answers generation error:', error);
      throw new Error('Failed to generate interview answers. Please check your OpenAI API key and try again.');
    }
  }

  // Embedding-based similarity matching
  async getEmbedding(text: string): Promise<number[]> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-ada-002',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate embedding');
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  calculateCosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async calculateSkillMatch(jobSkills: string[], candidateSkills: string[]): Promise<{
    score: number;
    matched_skills: string[];
    missing_skills: string[];
  }> {
    try {
      // Simple keyword matching as fallback
      const jobSkillsLower = jobSkills.map(s => s.toLowerCase());
      const candidateSkillsLower = candidateSkills.map(s => s.toLowerCase());
      
      const matched = jobSkillsLower.filter(skill => 
        candidateSkillsLower.some(candidateSkill => 
          candidateSkill.includes(skill) || skill.includes(candidateSkill)
        )
      );
      
      const missing = jobSkillsLower.filter(skill => !matched.includes(skill));
      const score = jobSkills.length > 0 ? (matched.length / jobSkills.length) * 100 : 0;

      return {
        score: Math.round(score),
        matched_skills: matched,
        missing_skills: missing
      };
    } catch (error) {
      console.error('Skill match calculation error:', error);
      return {
        score: 0,
        matched_skills: [],
        missing_skills: jobSkills
      };
    }
  }
}

export const aiService = new AIService();