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

class AIService {
  private openaiApiKey: string | null = null;

  constructor() {
    this.openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  private async callOpenAI(prompt: string, systemPrompt: string): Promise<any> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from OpenAI');
      }

      // Try to parse as JSON, fallback to text
      try {
        return JSON.parse(content);
      } catch {
        return { text: content };
      }
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw error;
    }
  }

  async analyzeJobFromUrl(url: string): Promise<JobAnalysisResult> {
    try {
      // Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please log in to use URL analysis');
      }

      // First scrape the job URL through the backend
      const scrapeResponse = await fetch(`/api/scrape/job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ url })
      });

      if (!scrapeResponse.ok) {
        if (scrapeResponse.status === 403) {
          throw new Error('The website is blocking automated requests. Please try copying the job description text instead.');
        } else if (scrapeResponse.status === 404) {
          throw new Error('The job posting URL was not found. Please check the URL and try again.');
        } else if (scrapeResponse.status >= 500) {
          throw new Error('Server error while accessing the URL. Please try again later or use the job text mode.');
        } else if (scrapeResponse.status === 401) {
          throw new Error('Please log in to use URL analysis');
        }
        throw new Error(`Failed to scrape job URL (${scrapeResponse.status}). Please try using the job text mode instead.`);
      }

      const { content } = await scrapeResponse.json();
      
      if (!content) {
        throw new Error('No content found at the provided URL. Please check the URL or try using the job text mode.');
      }

      // Now analyze the scraped content with AI
      return await this.analyzeJobFromText(content);
    } catch (error) {
      console.error('URL analysis error:', error);
      throw new Error(`URL analysis failed due to network issues or website restrictions. Please try copying the job description text instead. Details: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysisResult> {
    const systemPrompt = `You are an expert job analysis assistant. Analyze the provided job posting and extract key information in JSON format.

Return a JSON object with these exact fields:
{
  "company_name": "Company name from the job posting",
  "job_title": "Job title/position name",
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "required_profile": ["requirement 1", "requirement 2", ...],
  "job_description": "Full job description text"
}

Focus on:
- Extract the company name and job title clearly
- List main responsibilities and duties
- Identify required skills, experience, and qualifications
- Include the complete job description

Return only valid JSON, no additional text.`;

    try {
      const result = await this.callOpenAI(jobText, systemPrompt);
      
      // Validate the response structure
      if (!result.company_name || !result.job_title) {
        throw new Error('AI analysis did not return required fields');
      }

      return {
        company_name: result.company_name || 'Unknown Company',
        job_title: result.job_title || 'Unknown Position',
        responsibilities: Array.isArray(result.responsibilities) ? result.responsibilities : [],
        required_profile: Array.isArray(result.required_profile) ? result.required_profile : [],
        job_description: result.job_description || jobText
      };
    } catch (error) {
      console.error('Job text analysis error:', error);
      throw new Error(`Failed to analyze job text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeCVFromText(cvText: string): Promise<CVAnalysisResult> {
    const systemPrompt = `You are an expert CV/resume analysis assistant. Analyze the provided CV/resume and extract key information in JSON format.

Return a JSON object with these exact fields:
{
  "skills": ["skill 1", "skill 2", ...],
  "experience": ["experience 1", "experience 2", ...],
  "education": ["education 1", "education 2", ...],
  "achievements": ["achievement 1", "achievement 2", ...],
  "person": {
    "name": "Full Name",
    "email": "email@example.com",
    "phone": "phone number",
    "location": "city, country",
    "summary": "professional summary"
  }
}

Focus on:
- Technical and soft skills
- Work experience and roles
- Educational background
- Notable achievements and accomplishments
- Personal contact information
- Professional summary or objective

Return only valid JSON, no additional text.`;

    try {
      const result = await this.callOpenAI(cvText, systemPrompt);
      
      return {
        skills: Array.isArray(result.skills) ? result.skills : [],
        experience: Array.isArray(result.experience) ? result.experience : [],
        education: Array.isArray(result.education) ? result.education : [],
        achievements: Array.isArray(result.achievements) ? result.achievements : [],
        person: result.person || {}
      };
    } catch (error) {
      console.error('CV analysis error:', error);
      throw new Error(`Failed to analyze CV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async analyzeMatch(jobData: JobAnalysisResult, cvData: CVAnalysisResult): Promise<MatchAnalysisResult> {
    const systemPrompt = `You are an expert career matching assistant. Compare the job requirements with the candidate's profile and provide a detailed match analysis in JSON format.

Return a JSON object with these exact fields:
{
  "overall_score": 85,
  "strengths": ["strength 1", "strength 2", ...],
  "gaps": ["gap 1", "gap 2", ...],
  "recommendations": ["recommendation 1", "recommendation 2", ...]
}

Provide:
- Overall match score (0-100)
- Key strengths that align with the job
- Skill or experience gaps
- Specific recommendations for improvement

Return only valid JSON, no additional text.`;

    const prompt = `Job Requirements:
Company: ${jobData.company_name}
Position: ${jobData.job_title}
Responsibilities: ${jobData.responsibilities.join(', ')}
Required Profile: ${jobData.required_profile.join(', ')}

Candidate Profile:
Skills: ${cvData.skills.join(', ')}
Experience: ${cvData.experience.join(', ')}
Education: ${cvData.education.join(', ')}
Achievements: ${cvData.achievements.join(', ')}

Please analyze the match between this job and candidate.`;

    try {
      const result = await this.callOpenAI(prompt, systemPrompt);
      
      return {
        overall_score: typeof result.overall_score === 'number' ? result.overall_score : 0,
        strengths: Array.isArray(result.strengths) ? result.strengths : [],
        gaps: Array.isArray(result.gaps) ? result.gaps : [],
        recommendations: Array.isArray(result.recommendations) ? result.recommendations : []
      };
    } catch (error) {
      console.error('Match analysis error:', error);
      throw new Error(`Failed to analyze match: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateInterviewAnswers(jobData: JobAnalysisResult, cvData: CVAnalysisResult, questions: string[]): Promise<string[]> {
    const systemPrompt = `You are an expert interview coach. Generate personalized, professional interview answers based on the candidate's background and the specific job requirements.

For each question, provide a well-structured answer that:
- Demonstrates relevant experience from the candidate's background
- Aligns with the job requirements
- Uses the STAR method when appropriate (Situation, Task, Action, Result)
- Sounds natural and authentic

Return an array of strings, one answer per question.`;

    const prompt = `Job Context:
Company: ${jobData.company_name}
Position: ${jobData.job_title}
Key Responsibilities: ${jobData.responsibilities.join(', ')}
Requirements: ${jobData.required_profile.join(', ')}

Candidate Background:
Skills: ${cvData.skills.join(', ')}
Experience: ${cvData.experience.join(', ')}
Education: ${cvData.education.join(', ')}
Achievements: ${cvData.achievements.join(', ')}

Interview Questions:
${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

Please provide personalized answers for each question.`;

    try {
      const result = await this.callOpenAI(prompt, systemPrompt);
      
      if (Array.isArray(result)) {
        return result;
      } else if (result.answers && Array.isArray(result.answers)) {
        return result.answers;
      } else {
        // Fallback: try to extract answers from text
        const text = result.text || JSON.stringify(result);
        return questions.map((_, i) => `Answer ${i + 1}: Please provide a personalized response based on your experience.`);
      }
    } catch (error) {
      console.error('Interview answers generation error:', error);
      throw new Error(`Failed to generate interview answers: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const aiService = new AIService();