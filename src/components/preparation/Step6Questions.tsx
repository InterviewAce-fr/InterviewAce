import React, { useEffect, useMemo, useState } from 'react';
import { HelpCircle, MessageSquare, Brain, Code, Users, Building, TrendingUp, Heart, Tag } from 'lucide-react';

interface QAItem {
  question: string;
  answer: string;
}

interface AskItem {
  question: string;
  reason: string;
}

interface Step6QuestionsProps {
  data: {
    behavioral_questions?: QAItem[];
    technical_questions?: QAItem[];
    situational_questions?: QAItem[];
    company_questions?: QAItem[];
    career_questions?: QAItem[];
    personal_questions?: QAItem[];
    questions_to_ask?: AskItem[];
  };
  onUpdate: (data: any) => void;
}

const Step6Questions: React.FC<Step6QuestionsProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'behavioral' | 'technical' | 'situational' | 'company' | 'career' | 'personal'>('behavioral');

  const [formData, setFormData] = useState({
    behavioral_questions: data.behavioral_questions || [],
    technical_questions: data.technical_questions || [],
    situational_questions: data.situational_questions || [],
    company_questions: data.company_questions || [],
    career_questions: data.career_questions || [],
    personal_questions: data.personal_questions || [],
    questions_to_ask: data.questions_to_ask || []
  });

  // --- Suggestions catalog ---------------------------------------------------
  const questionCategories = [
    {
      key: 'behavioral',
      title: 'Behavioral',
      icon: <Brain className="w-4 h-4" />,
      color: 'blue',
      description: 'Questions about past experiences and how you handled situations',
      examples: [
        'Tell me about a time when you had to work under pressure',
        'Describe a situation where you had to resolve a conflict',
        'Give an example of when you showed leadership',
        'Tell me about a mistake you made and how you handled it',
        'Describe a time when you had to adapt to change',
        'Give an example of when you went above and beyond'
      ]
    },
    {
      key: 'technical',
      title: 'Technical',
      icon: <Code className="w-4 h-4" />,
      color: 'green',
      description: 'Questions about your technical skills and knowledge',
      examples: [
        'How would you approach solving [specific technical problem]?',
        'What technologies have you worked with recently?',
        'Explain a complex technical concept in simple terms',
        'How do you stay updated with new technologies?',
        'Describe your development process',
        "What's your experience with [specific technology]?"
      ]
    },
    {
      key: 'situational',
      title: 'Situational',
      icon: <Users className="w-4 h-4" />,
      color: 'purple',
      description: 'Hypothetical scenarios to assess problem-solving skills',
      examples: [
        'How would you handle a difficult client?',
        'What would you do if you disagreed with your manager?',
        'How would you prioritize competing deadlines?',
        'How would you handle a team member not pulling their weight?',
        'What would you do if you discovered a major bug in production?',
        'How would you approach a project with unclear requirements?'
      ]
    },
    {
      key: 'company',
      title: 'Company-Specific',
      icon: <Building className="w-4 h-4" />,
      color: 'yellow',
      description: 'Questions about the company, culture, and industry',
      examples: [
        'Why do you want to work for our company?',
        'What do you know about our recent developments?',
        'How do you see our industry evolving?',
        'What attracts you to our company culture?',
        'How would you contribute to our mission?',
        'What do you know about our competitors?'
      ]
    },
    {
      key: 'career',
      title: 'Career & Goals',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'indigo',
      description: 'Questions about your career aspirations and goals',
      examples: [
        'Where do you see yourself in 5 years?',
        'What are your career goals?',
        'Why are you looking to change roles?',
        'What motivates you in your career?',
        'How does this role fit into your career plan?',
        'What skills do you want to develop?'
      ]
    },
    {
      key: 'personal',
      title: 'Personal',
      icon: <Heart className="w-4 h-4" />,
      color: 'pink',
      description: 'Questions about your personality and work style',
      examples: [
        'What motivates you?',
        'How do you handle stress?',
        'What are your strengths and weaknesses?',
        'How would your colleagues describe you?',
        "What's your ideal work environment?",
        'How do you prefer to receive feedback?'
      ]
    }
  ] as const;

  type CatKey = typeof questionCategories[number]['key'];
  const catByKey: Record<CatKey, (typeof questionCategories)[number]> = useMemo(() => {
    return questionCategories.reduce((acc, c) => {
      // @ts-ignore
      acc[c.key] = c; return acc;
    }, {} as any);
  }, []);

  // --- Track which suggestions are currently selected so we can hide them -----
  const makeKey = (cat: CatKey, text: string) => `${cat}::${text.trim()}`;
  const [selectedSuggestionKeys, setSelectedSuggestionKeys] = useState<Set<string>>(new Set());

  // --- CRUD helpers ----------------------------------------------------------
  const commit = (updated: typeof formData) => {
    setFormData(updated);
    onUpdate(updated);
  };

  const addQuestion = (category: keyof typeof formData) => {
    const newQuestion = category === 'questions_to_ask' ? { question: '', reason: '' } : { question: '', answer: '' };
    const updated = { ...formData, [category]: [...formData[category], newQuestion] };
    commit(updated);
  };

  const updateQuestion = (category: keyof typeof formData, index: number, field: string, value: string) => {
    const updatedCat = [...formData[category]] as any[];
    updatedCat[index] = { ...updatedCat[index], [field]: value };
    const updated = { ...formData, [category]: updatedCat };
    commit(updated);
  };

  const removeQuestion = (category: keyof typeof formData, index: number) => {
    if (category !== 'questions_to_ask') {
      const catKey = category.replace('_questions', '') as CatKey;
      const item = (formData[category] as QAItem[])[index];
      if (item && catByKey[catKey].examples.includes(item.question)) {
        const key = makeKey(catKey, item.question);
        setSelectedSuggestionKeys((prev) => {
          const next = new Set(prev); next.delete(key); return next;
        });
      }
    }

    const updated = { ...formData, [category]: formData[category].filter((_, i) => i !== index) };
    commit(updated);
  };

  const addSuggestedQuestion = (question: string) => {
    const category = (activeTab + '_questions') as keyof typeof formData;
    if (category !== 'questions_to_ask') {
      const updated = { ...formData, [category]: [...(formData[category] as QAItem[]), { question, answer: '' }] };
      const key = makeKey(activeTab, question);
      setSelectedSuggestionKeys((prev) => new Set(prev).add(key));
      commit(updated);
    }
  };

  const suggestedQuestionsToAsk = [
    'What does success look like in this role after 6 months?',
    'What are the biggest challenges facing the team right now?',
    'How would you describe the company culture?',
    'What opportunities are there for professional development?',
    'What do you enjoy most about working here?',
    "How does this role contribute to the company's overall goals?",
    'What are the next steps in the interview process?',
    "Can you tell me about the team I'd be working with?"
  ];

  const addSuggestedQuestionToAsk = (question: string) => {
    const updated = { ...formData, questions_to_ask: [...formData.questions_to_ask, { question, reason: '' }] };
    commit(updated);
  };

  // --- UI helpers ------------------------------------------------------------
  const getColorClasses = (color: string, active = false) => {
    const colors: Record<string, string> = {
      blue: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      green: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: active ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      yellow: active ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
      indigo: active ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      pink: active ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
    };
    return colors[color] || colors.blue;
  };

  const getCurrentCategory = () => questionCategories.find((c) => c.key === activeTab) ?? questionCategories[0];

  const getPreparedFor = (k: CatKey) => (formData as any)[`${k}_questions`] as QAItem[];

  const filteredSuggestionsForActive = () => {
    const cat = getCurrentCategory();
    return cat.examples.filter((ex) => !selectedSuggestionKeys.has(makeKey(cat.key as CatKey, ex)));
  };

  return (
    <div className="max-w-6xl mx-auto p-6">{/* ...rest of component unchanged ... */}</div>
  );
};

export default Step6Questions;