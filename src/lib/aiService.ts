interface JobAnalysis {
  company_name: string;
  job_title: string;
  responsibilities: string[];
  required_profile: string[];
}

interface CVAnalysis {
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    responsibilities: string[];
  }>;
  skills: {
    technical: string[];
    soft: string[];
    inferred: string[];
  };
}

interface MatchResult {
  skill: string;
  requirement: string;
  similarity: number;
  grade: 'High' | 'Moderate' | 'Low';
}

interface MatchAnalysis {
  matches: MatchResult[];
  overallScore: number;
  distribution: {
    high: number;
    moderate: number;
    low: number;
  };
}

interface WhySuggestions {
  whyYou: string;
  whyThem: string;
  whyNow: string;
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  }

  async analyzeJobFromUrl(url: string): Promise<JobAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scrape/job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error('Failed to scrape job posting');
      }

      const data = await response.json();
      return this.analyzeJobFromText(data.content);
    } catch (error) {
      console.error('Job URL analysis failed:', error);
      throw error;
    }
  }

  async analyzeJobFromText(jobText: string): Promise<JobAnalysis> {
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
              content: `You are an expert job posting analyzer. Extract structured information from job postings and return it as JSON.

Return the data in this exact format:
{
  "company_name": "string",
  "job_title": "string", 
  "responsibilities": ["array", "of", "strings"],
  "required_profile": ["array", "of", "requirements"]
}

Focus on:
- Extract the exact company name and job title
- List key responsibilities/duties (5-8 items)
- List required skills, experience, qualifications (5-10 items)
- Be specific and concise
- Only return valid JSON, no additional text`
            },
            {
              role: 'user',
              content: jobText
            }
          ],
          temperature: 0.3,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Job text analysis failed:', error);
      throw error;
    }
  }

  async analyzeCVText(cvText: string): Promise<CVAnalysis> {
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
              content: `You are an expert CV/resume analyzer. Extract structured information from CVs and return it as JSON.

Return the data in this exact format:
{
  "education": [
    {
      "degree": "string",
      "institution": "string", 
      "year": "string"
    }
  ],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "duration": "string",
      "responsibilities": ["array", "of", "strings"]
    }
  ],
  "skills": {
    "technical": ["explicitly", "mentioned", "technical", "skills"],
    "soft": ["communication", "leadership", "etc"],
    "inferred": ["skills", "inferred", "from", "experience", "and", "education"]
  }
}

Focus on:
- Extract education with degree, institution, year
- Extract work experience with title, company, duration, key responsibilities
- List explicitly mentioned technical and soft skills
- Infer additional skills from experience and education context
- Be comprehensive but concise
- Only return valid JSON, no additional text`
            },
            {
              role: 'user',
              content: cvText
            }
          ],
          temperature: 0.3,
          max_tokens: 1500
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('CV analysis failed:', error);
      throw error;
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI embeddings request failed');
      }

      const data = await response.json();
      return data.data[0]?.embedding || [];
    } catch (error) {
      console.error('Embedding generation failed:', error);
      throw error;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private getGrade(similarity: number): 'High' | 'Moderate' | 'Low' {
    if (similarity >= 0.8) return 'High';
    if (similarity >= 0.6) return 'Moderate';
    return 'Low';
  }

  async analyzeMatching(candidateSkills: string[], jobRequirements: string[]): Promise<MatchAnalysis> {
    try {
      const matches: MatchResult[] = [];
      
      // Get embeddings for all skills and requirements
      const skillEmbeddings = await Promise.all(
        candidateSkills.map(skill => this.getEmbedding(skill))
      );
      
      const requirementEmbeddings = await Promise.all(
        jobRequirements.map(req => this.getEmbedding(req))
      );

      // Calculate similarities
      for (let i = 0; i < candidateSkills.length; i++) {
        for (let j = 0; j < jobRequirements.length; j++) {
          const similarity = this.cosineSimilarity(skillEmbeddings[i], requirementEmbeddings[j]);
          
          if (similarity > 0.5) { // Only include meaningful matches
            matches.push({
              skill: candidateSkills[i],
              requirement: jobRequirements[j],
              similarity,
              grade: this.getGrade(similarity)
            });
          }
        }
      }

      // Sort by similarity and take top matches
      matches.sort((a, b) => b.similarity - a.similarity);
      const topMatches = matches.slice(0, 20);

      // Calculate distribution
      const distribution = {
        high: topMatches.filter(m => m.grade === 'High').length,
        moderate: topMatches.filter(m => m.grade === 'Moderate').length,
        low: topMatches.filter(m => m.grade === 'Low').length
      };

      // Calculate overall score
      const overallScore = topMatches.length > 0 
        ? Math.round((topMatches.reduce((sum, match) => sum + match.similarity, 0) / topMatches.length) * 100)
        : 0;

      return {
        matches: topMatches,
        overallScore,
        distribution
      };
    } catch (error) {
      console.error('Matching analysis failed:', error);
      throw error;
    }
  }

  async generateWhySuggestions(
    candidateData: any,
    jobData: any,
    companyData: any,
    matchingData: any
  ): Promise<WhySuggestions> {
    try {
      const context = {
        candidate: candidateData,
        job: jobData,
        company: companyData,
        matching: matchingData
      };

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
              content: `You are an expert interview coach. Generate personalized answers for common interview questions based on the candidate's profile, job requirements, company analysis, and skill matching results.

Return the data in this exact format:
{
  "whyYou": "A compelling 2-3 sentence pitch highlighting the candidate's best matches and unique value proposition",
  "whyThem": "A thoughtful 2-3 sentence answer about why the candidate wants to work for this specific company, based on company analysis",
  "whyNow": "A strategic 2-3 sentence answer about why this role aligns with the candidate's career goals and timing"
}

Guidelines:
- Use specific examples from the candidate's experience
- Reference high-match skills and achievements
- Connect to company values/strategy when available
- Be authentic and conversational, not generic
- Focus on mutual benefit and genuine interest
- Only return valid JSON, no additional text`
            },
            {
              role: 'user',
              content: JSON.stringify(context)
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('Why suggestions generation failed:', error);
      throw error;
    }
  }
}

export const aiService = new AIService();