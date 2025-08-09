import { supabase } from './supabase';

export interface JobAnalysis {
  company_name: string;
  job_title: string;
  responsibilities: string[];
  required_profile: string[];
  job_description?: string;
}

export interface CVAnalysis {
  education: Array<{
    degree: string;
    institution: string;
    year?: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    responsibilities: string[];
  }>;
  skills: {
    explicit: string[];
    inferred: string[];
  };
}

export interface MatchResult {
  skill: string;
  grade: 'High' | 'Moderate' | 'Low';
  similarity: number;
  color: string;
}

export interface MatchAnalysis {
  overall_score: number;
  matches: MatchResult[];
  distribution: {
    high: number;
    moderate: number;
    low: number;
  };
}

export interface WhySuggestions {
  why_you: string;
  why_company: string;
  why_role: string;
}

class AIService {
  private apiKey: string | null = null;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async analyzeJobFromUrl(url: string): Promise<JobAnalysis> {
    try {
      const token = await this.getAuthToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/scrape/job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to scrape job posting');
      }

      const data = await response.json();
      return this.analyzeJobFromText(data.content);
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze job from URL');
    }
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysis> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert job posting analyzer. Extract structured information from job postings and return valid JSON only.'
            },
            {
              role: 'user',
              content: `Analyze this job posting and extract the following information in JSON format:
              {
                "company_name": "string",
                "job_title": "string", 
                "responsibilities": ["array of key responsibilities"],
                "required_profile": ["array of requirements and qualifications"]
              }
              
              Job posting:
              ${jobText}`
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze job text');
    }
  }

  async analyzeCVText(cvText: string): Promise<CVAnalysis> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert CV analyzer. Extract structured information from CVs and return valid JSON only.'
            },
            {
              role: 'user',
              content: `Analyze this CV and extract the following information in JSON format:
              {
                "education": [{"degree": "string", "institution": "string", "year": "string"}],
                "experience": [{"title": "string", "company": "string", "duration": "string", "responsibilities": ["array"]}],
                "skills": {
                  "explicit": ["skills explicitly mentioned"],
                  "inferred": ["skills inferred from education and experience"]
                }
              }
              
              CV text:
              ${cvText}`
            }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze CV text');
    }
  }

  async analyzeMatch(candidateSkills: string[], jobRequirements: string[]): Promise<MatchAnalysis> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      // Get embeddings for candidate skills
      const candidateEmbeddings = await this.getEmbeddings(candidateSkills);
      
      // Get embeddings for job requirements
      const jobEmbeddings = await this.getEmbeddings(jobRequirements);

      // Calculate similarity scores
      const matches: MatchResult[] = [];
      
      for (let i = 0; i < candidateSkills.length; i++) {
        let maxSimilarity = 0;
        
        for (let j = 0; j < jobRequirements.length; j++) {
          const similarity = this.cosineSimilarity(candidateEmbeddings[i], jobEmbeddings[j]);
          maxSimilarity = Math.max(maxSimilarity, similarity);
        }

        let grade: 'High' | 'Moderate' | 'Low';
        let color: string;

        if (maxSimilarity >= 0.8) {
          grade = 'High';
          color = 'text-green-600 bg-green-50';
        } else if (maxSimilarity >= 0.6) {
          grade = 'Moderate';
          color = 'text-yellow-600 bg-yellow-50';
        } else {
          grade = 'Low';
          color = 'text-red-600 bg-red-50';
        }

        matches.push({
          skill: candidateSkills[i],
          grade,
          similarity: maxSimilarity,
          color
        });
      }

      // Calculate distribution
      const distribution = {
        high: matches.filter(m => m.grade === 'High').length,
        moderate: matches.filter(m => m.grade === 'Moderate').length,
        low: matches.filter(m => m.grade === 'Low').length
      };

      // Calculate overall score
      const totalSkills = matches.length;
      const weightedScore = matches.reduce((sum, match) => {
        const weight = match.grade === 'High' ? 1 : match.grade === 'Moderate' ? 0.6 : 0.2;
        return sum + weight;
      }, 0);
      
      const overall_score = totalSkills > 0 ? Math.round((weightedScore / totalSkills) * 100) : 0;

      return {
        overall_score,
        matches: matches.sort((a, b) => b.similarity - a.similarity),
        distribution
      };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to analyze match');
    }
  }

  private async getEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: texts
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `OpenAI embeddings request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.data.map((item: any) => item.embedding);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async generateWhySuggestions(
    jobData: any,
    cvData: any,
    swotData: any,
    matchData: any
  ): Promise<WhySuggestions> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert interview coach. Generate personalized, concise answers for common interview questions based on the candidate\'s profile and job analysis.'
            },
            {
              role: 'user',
              content: `Based on the following information, generate personalized answers for these interview questions. Keep each answer concise (2-3 sentences) and compelling:

              Job Information:
              ${JSON.stringify(jobData, null, 2)}
              
              Candidate Profile:
              ${JSON.stringify(cvData, null, 2)}
              
              Company Analysis (SWOT):
              ${JSON.stringify(swotData, null, 2)}
              
              Skills Match Analysis:
              ${JSON.stringify(matchData, null, 2)}
              
              Generate answers in JSON format:
              {
                "why_you": "Why should we hire you?",
                "why_company": "Why do you want to work for this company?", 
                "why_role": "Why are you interested in this role?"
              }`
            }
          ],
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No response from OpenAI');
      }

      try {
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content);
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to generate suggestions');
    }
  }
}

export const aiService = new AIService();