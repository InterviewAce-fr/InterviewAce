interface CVData {
  education: Array<{
    degree: string;
    institution: string;
    year: string;
    field: string;
  }>;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    responsibilities: string[];
  }>;
  skills: Array<{
    name: string;
    category: string;
    source: 'explicit' | 'inferred';
  }>;
}

interface JobData {
  company_name: string;
  job_title: string;
  responsibilities: string[];
  required_profile: Array<{
    category: string;
    requirements: string[];
  }>;
}

interface MatchResult {
  skill: string;
  requirement: string;
  grade: 'High' | 'Moderate' | 'Low';
  score: number;
}

interface MatchingResults {
  matches: MatchResult[];
  overall_score: number;
  grade_distribution: {
    high: number;
    moderate: number;
    low: number;
  };
}

class AIService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1';
  }

  async parseCV(text: string): Promise<CVData> {
    const prompt = `
Extract structured data from this CV/resume text. Return a JSON object with:
- education: array of {degree, institution, year, field}
- experience: array of {title, company, duration, responsibilities[]}
- skills: array of {name, category, source} where source is 'explicit' (directly mentioned) or 'inferred' (from education/experience)

Include both technical and soft skills. Infer skills from job responsibilities and education.

CV Text:
${text}

Return only valid JSON:`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert CV parser. Extract structured data and return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 2000
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Clean and parse JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to extract JSON from response');
    } catch (error) {
      console.error('CV parsing error:', error);
      throw new Error('Failed to parse CV');
    }
  }

  async parseJobPosting(content: string): Promise<JobData> {
    const prompt = `
Extract structured data from this job posting. Return a JSON object with:
- company_name: string
- job_title: string
- responsibilities: array of key job responsibilities
- required_profile: array of {category, requirements[]} where category is like "Experience", "Skills", "Education"

Job Posting:
${content}

Return only valid JSON:`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert job posting analyzer. Extract structured data and return only valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1500
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to extract JSON from response');
    } catch (error) {
      console.error('Job parsing error:', error);
      throw new Error('Failed to parse job posting');
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text
        })
      });

      const data = await response.json();
      return data.data[0].embedding;
    } catch (error) {
      console.error('Embedding error:', error);
      throw new Error('Failed to get embedding');
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  private scoreToGrade(score: number): 'High' | 'Moderate' | 'Low' {
    if (score >= 0.8) return 'High';
    if (score >= 0.6) return 'Moderate';
    return 'Low';
  }

  async matchCandidateToJob(cvData: CVData, jobData: JobData): Promise<MatchingResults> {
    try {
      // Combine candidate skills and experience
      const candidateTexts = [
        ...cvData.skills.map(s => s.name),
        ...cvData.experience.flatMap(e => e.responsibilities)
      ];

      // Combine job requirements
      const jobTexts = [
        ...jobData.responsibilities,
        ...jobData.required_profile.flatMap(p => p.requirements)
      ];

      // Get embeddings for all texts
      const candidateEmbeddings = await Promise.all(
        candidateTexts.map(text => this.getEmbedding(text))
      );
      
      const jobEmbeddings = await Promise.all(
        jobTexts.map(text => this.getEmbedding(text))
      );

      // Calculate matches
      const matches: MatchResult[] = [];
      
      for (let i = 0; i < candidateTexts.length; i++) {
        for (let j = 0; j < jobTexts.length; j++) {
          const similarity = this.cosineSimilarity(candidateEmbeddings[i], jobEmbeddings[j]);
          
          if (similarity > 0.5) { // Only include meaningful matches
            matches.push({
              skill: candidateTexts[i],
              requirement: jobTexts[j],
              grade: this.scoreToGrade(similarity),
              score: similarity
            });
          }
        }
      }

      // Sort by score and take top matches
      matches.sort((a, b) => b.score - a.score);
      const topMatches = matches.slice(0, 20);

      // Calculate overall score and distribution
      const overall_score = topMatches.length > 0 
        ? topMatches.reduce((sum, match) => sum + match.score, 0) / topMatches.length
        : 0;

      const grade_distribution = {
        high: topMatches.filter(m => m.grade === 'High').length,
        moderate: topMatches.filter(m => m.grade === 'Moderate').length,
        low: topMatches.filter(m => m.grade === 'Low').length
      };

      return {
        matches: topMatches,
        overall_score,
        grade_distribution
      };
    } catch (error) {
      console.error('Matching error:', error);
      throw new Error('Failed to match candidate to job');
    }
  }

  async generateWhySuggestions(
    cvData: CVData, 
    jobData: JobData, 
    matchingResults: MatchingResults,
    swotData?: any
  ): Promise<{
    whyYou: string;
    whyCompany: string;
    whyRole: string;
  }> {
    const topMatches = matchingResults.matches
      .filter(m => m.grade === 'High')
      .slice(0, 5)
      .map(m => m.skill)
      .join(', ');

    const prompt = `
Based on the following data, generate concise, compelling answers for interview questions:

CANDIDATE DATA:
${JSON.stringify(cvData, null, 2)}

JOB DATA:
${JSON.stringify(jobData, null, 2)}

TOP MATCHING SKILLS: ${topMatches}

COMPANY STRATEGY (if available):
${swotData ? JSON.stringify(swotData, null, 2) : 'Not provided'}

Generate 3 answers (each 2-3 sentences):

1. "Why You?" - Focus on top matching skills and unique value
2. "Why This Company?" - Based on company strategy and job data
3. "Why This Role?" - Based on high-match responsibilities and career growth

Return as JSON:
{
  "whyYou": "...",
  "whyCompany": "...", 
  "whyRole": "..."
}`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert interview coach. Generate compelling, personalized answers based on data analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 800
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to extract JSON from response');
    } catch (error) {
      console.error('Suggestion generation error:', error);
      return {
        whyYou: 'Based on your experience and skills, you bring unique value to this role.',
        whyCompany: 'This company aligns with your career goals and values.',
        whyRole: 'This role offers growth opportunities that match your aspirations.'
      };
    }
  }

  async scrapeJobPosting(url: string): Promise<string> {
    // This would typically use a backend service with Playwright or SerpApi
    // For now, we'll return a placeholder
    try {
      // In a real implementation, this would call your backend API
      const response = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      
      if (!response.ok) {
        throw new Error('Failed to scrape job posting');
      }
      
      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Scraping error:', error);
      throw new Error('Failed to scrape job posting. Please paste the job description directly.');
    }
  }
}

export const aiService = new AIService();
export type { CVData, JobData, MatchingResults, MatchResult };