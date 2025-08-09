import { supabase } from './supabase';

// Types for AI service responses
export interface JobAnalysisResult {
  company_name: string;
  job_title: string;
  responsibilities: string[];
  required_profile: string[];
}

export interface CVAnalysisResult {
  skills: string[];
  experience: string[];
  education: string[];
}

export interface MatchingResult {
  overall_score: number;
  skill_matches: Array<{
    skill: string;
    match_type: 'exact' | 'partial' | 'missing';
    confidence: number;
  }>;
  experience_matches: Array<{
    experience: string;
    relevance: number;
  }>;
}

export interface WhySuggestion {
  question: string;
  suggested_answer: string;
  key_points: string[];
}

class AIService {
  private openaiApiKey: string;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not found. AI features will be disabled.');
    }
  }

  private async callOpenAI(messages: any[], model = 'gpt-3.5-turbo') {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.openaiApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'OpenAI API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysisResult> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert job analyst. Analyze the provided job description and extract key information. 
          Return ONLY a valid JSON object with this exact structure:
          {
            "company_name": "string",
            "job_title": "string", 
            "responsibilities": ["array", "of", "strings"],
            "required_profile": ["array", "of", "strings"]
          }`
        },
        {
          role: 'user',
          content: `Analyze this job description:\n\n${jobText}`
        }
      ];

      const response = await this.callOpenAI(messages);
      
      // Parse the JSON response
      const parsed = JSON.parse(response);
      
      return {
        company_name: parsed.company_name || 'Unknown Company',
        job_title: parsed.job_title || 'Unknown Position',
        responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
        required_profile: Array.isArray(parsed.required_profile) ? parsed.required_profile : []
      };
    } catch (error) {
      console.error('Job analysis error:', error);
      throw new Error('Failed to analyze job description');
    }
  }

  async analyzeJobFromUrl(jobUrl: string): Promise<JobAnalysisResult> {
    try {
      // For URL analysis, we'll try to fetch the content
      // Note: This may fail due to CORS policies
      const response = await fetch(jobUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch job posting');
      }
      
      const html = await response.text();
      
      // Extract text content from HTML (basic extraction)
      const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      return this.analyzeJobFromText(textContent);
    } catch (error) {
      console.error('URL analysis error:', error);
      throw new Error('Failed to analyze job URL. Try copying the job description text instead.');
    }
  }

  async analyzeCVText(cvText: string): Promise<CVAnalysisResult> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert CV analyst. Analyze the provided CV/resume and extract key information.
          Return ONLY a valid JSON object with this exact structure:
          {
            "skills": ["array", "of", "technical", "and", "soft", "skills"],
            "experience": ["array", "of", "work", "experience", "descriptions"],
            "education": ["array", "of", "education", "qualifications"]
          }`
        },
        {
          role: 'user',
          content: `Analyze this CV/resume:\n\n${cvText}`
        }
      ];

      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      
      return {
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        experience: Array.isArray(parsed.experience) ? parsed.experience : [],
        education: Array.isArray(parsed.education) ? parsed.education : []
      };
    } catch (error) {
      console.error('CV analysis error:', error);
      throw new Error('Failed to analyze CV');
    }
  }

  async performMatching(
    cvSkills: string[],
    cvExperience: string[],
    jobRequirements: string[],
    jobResponsibilities: string[]
  ): Promise<MatchingResult> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert at matching candidates to job requirements. Analyze the CV data against job requirements.
          Return ONLY a valid JSON object with this exact structure:
          {
            "overall_score": number_between_0_and_100,
            "skill_matches": [
              {
                "skill": "skill_name",
                "match_type": "exact|partial|missing",
                "confidence": number_between_0_and_1
              }
            ],
            "experience_matches": [
              {
                "experience": "experience_description", 
                "relevance": number_between_0_and_1
              }
            ]
          }`
        },
        {
          role: 'user',
          content: `Match this candidate profile against the job requirements:
          
          CANDIDATE SKILLS: ${cvSkills.join(', ')}
          CANDIDATE EXPERIENCE: ${cvExperience.join('; ')}
          
          JOB REQUIREMENTS: ${jobRequirements.join('; ')}
          JOB RESPONSIBILITIES: ${jobResponsibilities.join('; ')}`
        }
      ];

      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      
      return {
        overall_score: parsed.overall_score || 0,
        skill_matches: Array.isArray(parsed.skill_matches) ? parsed.skill_matches : [],
        experience_matches: Array.isArray(parsed.experience_matches) ? parsed.experience_matches : []
      };
    } catch (error) {
      console.error('Matching analysis error:', error);
      throw new Error('Failed to perform matching analysis');
    }
  }

  async generateWhySuggestions(
    cvData: any,
    jobData: any,
    matchingResults: any,
    swotData: any
  ): Promise<WhySuggestion[]> {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are an expert interview coach. Generate personalized "Why" question answers for job interviews.
          Return ONLY a valid JSON array with this exact structure:
          [
            {
              "question": "Why do you want to work here?",
              "suggested_answer": "detailed_answer_text",
              "key_points": ["point1", "point2", "point3"]
            }
          ]`
        },
        {
          role: 'user',
          content: `Generate interview answers based on this data:
          
          CV DATA: ${JSON.stringify(cvData)}
          JOB DATA: ${JSON.stringify(jobData)}
          MATCHING RESULTS: ${JSON.stringify(matchingResults)}
          SWOT ANALYSIS: ${JSON.stringify(swotData)}`
        }
      ];

      const response = await this.callOpenAI(messages);
      const parsed = JSON.parse(response);
      
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('Suggestions generation error:', error);
      throw new Error('Failed to generate suggestions');
    }
  }
}

export const aiService = new AIService();