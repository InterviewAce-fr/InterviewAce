export interface NewsItem {
  title: string;
  url: string;
  source?: string;
  date?: string;
  summary?: string;
}

export interface QAItem {
  question: string;
  answer?: string;
  note?: string;
}

export interface ProfileMatchItem {
  requirement: string;
  evidence: string;
  score?: number;
}

export interface ReportData {
  generatedAt?: string;

  candidate: {
    name: string;
    title?: string;
    seniority?: string;
    location?: string;
    skills?: string[];
  };

  role: {
    title: string;
    team?: string;
    level?: string;
    location?: string;
  };

  company: {
    name: string;
    businessModel?: string;
    revenueStreams?: string[];
    pricing?: string[];
    keyCustomers?: string[];
    topNews?: NewsItem[];
  };

  strategy?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };

  profileMatch?: {
    matchScore?: number;
    summary?: string;
    items: ProfileMatchItem[];
  };

  why?: {
    whyCompany?: string[];
    whyRole?: string[];
    whyYou?: string[];
  };

  interview?: {
    questionsForCandidate?: QAItem[];
    questionsForCompany?: QAItem[];
  };
}
