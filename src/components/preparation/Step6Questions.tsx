import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Brain, Code, Users, Building, TrendingUp, Heart } from 'lucide-react';

interface Step6QuestionsProps {
  data: {
    behavioral_questions?: Array<{ question: string; answer: string; }>;
    technical_questions?: Array<{ question: string; answer: string; }>;
    situational_questions?: Array<{ question: string; answer: string; }>;
    company_questions?: Array<{ question: string; answer: string; }>;
    career_questions?: Array<{ question: string; answer: string; }>;
    personal_questions?: Array<{ question: string; answer: string; }>;
    questions_to_ask?: Array<{ question: string; reason: string; }>;
  };
  onUpdate: (data: any) => void;
}

const Step6Questions: React.FC<Step6QuestionsProps> = ({ data, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('behavioral');
  const [formData, setFormData] = useState({
    behavioral_questions: data.behavioral_questions || [],
    technical_questions: data.technical_questions || [],
    situational_questions: data.situational_questions || [],
    company_questions: data.company_questions || [],
    career_questions: data.career_questions || [],
    personal_questions: data.personal_questions || [],
    questions_to_ask: data.questions_to_ask || []
  });

  const addQuestion = (category: keyof typeof formData) => {
    const newQuestion = category === 'questions_to_ask' 
      ? { question: '', reason: '' }
      : { question: '', answer: '' };
    
    const updatedQuestions = [...formData[category], newQuestion];
    const updatedData = { ...formData, [category]: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const updateQuestion = (category: keyof typeof formData, index: number, field: string, value: string) => {
    const updatedQuestions = [...formData[category]];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    const updatedData = { ...formData, [category]: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const removeQuestion = (category: keyof typeof formData, index: number) => {
    const updatedQuestions = formData[category].filter((_, i) => i !== index);
    const updatedData = { ...formData, [category]: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const addSuggestedQuestion = (question: string) => {
    const category = activeTab + '_questions' as keyof typeof formData;
    if (category !== 'questions_to_ask') {
      const updatedQuestions = [...formData[category], { question, answer: '' }];
      const updatedData = { ...formData, [category]: updatedQuestions };
      setFormData(updatedData);
      onUpdate(updatedData);
    }
  };

  const questionCategories = [
    {
      key: 'behavioral',
      title: 'Behavioral',
      icon: <Brain className="w-4 h-4" />,
      color: 'blue',
      description: 'Questions about past experiences and how you handled situations',
      examples: [
        "Tell me about a time when you had to work under pressure",
        "Describe a situation where you had to resolve a conflict",
        "Give an example of when you showed leadership",
        "Tell me about a mistake you made and how you handled it",
        "Describe a time when you had to adapt to change",
        "Give an example of when you went above and beyond"
      ]
    },
    {
      key: 'technical',
      title: 'Technical',
      icon: <Code className="w-4 h-4" />,
      color: 'green',
      description: 'Questions about your technical skills and knowledge',
      examples: [
        "How would you approach solving [specific technical problem]?",
        "What technologies have you worked with recently?",
        "Explain a complex technical concept in simple terms",
        "How do you stay updated with new technologies?",
        "Describe your development process",
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
        "How would you handle a difficult client?",
        "What would you do if you disagreed with your manager?",
        "How would you prioritize competing deadlines?",
        "How would you handle a team member not pulling their weight?",
        "What would you do if you discovered a major bug in production?",
        "How would you approach a project with unclear requirements?"
      ]
    },
    {
      key: 'company',
      title: 'Company-Specific',
      icon: <Building className="w-4 h-4" />,
      color: 'yellow',
      description: 'Questions about the company, culture, and industry',
      examples: [
        "Why do you want to work for our company?",
        "What do you know about our recent developments?",
        "How do you see our industry evolving?",
        "What attracts you to our company culture?",
        "How would you contribute to our mission?",
        "What do you know about our competitors?"
      ]
    },
    {
      key: 'career',
      title: 'Career & Goals',
      icon: <TrendingUp className="w-4 h-4" />,
      color: 'indigo',
      description: 'Questions about your career aspirations and goals',
      examples: [
        "Where do you see yourself in 5 years?",
        "What are your career goals?",
        "Why are you looking to change roles?",
        "What motivates you in your career?",
        "How does this role fit into your career plan?",
        "What skills do you want to develop?"
      ]
    },
    {
      key: 'personal',
      title: 'Personal',
      icon: <Heart className="w-4 h-4" />,
      color: 'pink',
      description: 'Questions about your personality and work style',
      examples: [
        "What motivates you?",
        "How do you handle stress?",
        "What are your strengths and weaknesses?",
        "How would your colleagues describe you?",
        "What's your ideal work environment?",
        "How do you prefer to receive feedback?"
      ]
    }
  ];

  const getColorClasses = (color: string, active: boolean = false) => {
    const colors = {
      blue: active ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100',
      green: active ? 'bg-green-600 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100',
      purple: active ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 hover:bg-purple-100',
      yellow: active ? 'bg-yellow-600 text-white' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100',
      indigo: active ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100',
      pink: active ? 'bg-pink-600 text-white' : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getCurrentCategory = () => {
    return questionCategories.find(cat => cat.key === activeTab) || questionCategories[0];
  };

  const getCurrentQuestions = () => {
    const category = activeTab + '_questions' as keyof typeof formData;
    return formData[category] || [];
  };

  const suggestedQuestionsToAsk = [
    "What does success look like in this role after 6 months?",
    "What are the biggest challenges facing the team right now?",
    "How would you describe the company culture?",
    "What opportunities are there for professional development?",
    "What do you enjoy most about working here?",
    "How does this role contribute to the company's overall goals?",
    "What are the next steps in the interview process?",
    "Can you tell me about the team I'd be working with?"
  ];

  const addSuggestedQuestionToAsk = (question: string) => {
    const updatedQuestions = [...formData.questions_to_ask, { question, reason: '' }];
    const updatedData = { ...formData, questions_to_ask: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Interview Questions</h2>
          <p className="text-gray-600">
            Prepare answers for common questions and thoughtful questions to ask
          </p>
        </div>

        {/* Section 1: Questions to Prepare Answers For */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-blue-600" />
            Questions to Prepare Answers For
          </h3>

          {/* Horizontal Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b">
            {questionCategories.map((category) => (
              <button
                key={category.key}
                onClick={() => setActiveTab(category.key)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-t-lg font-medium transition-colors ${
                  getColorClasses(category.color, activeTab === category.key)
                }`}
              >
                {category.icon}
                <span>{category.title}</span>
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-2">
                {getCurrentCategory().title} Questions
              </h4>
              <p className="text-gray-600 text-sm mb-4">
                {getCurrentCategory().description}
              </p>
            </div>

            {/* Suggested Questions */}
            <div className="mb-6">
              <h5 className="font-medium text-gray-700 mb-3">💡 Common Questions (Click to Add)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {getCurrentCategory().examples.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => addSuggestedQuestion(example)}
                    className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors text-sm text-gray-700"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* User's Questions */}
            <div className="space-y-4">
              <h5 className="font-medium text-gray-700">Your Prepared Questions & Answers</h5>
              {getCurrentQuestions().map((item: any, index: number) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <h6 className="font-medium text-gray-800">Question {index + 1}</h6>
                    <button
                      onClick={() => removeQuestion(activeTab + '_questions' as keyof typeof formData, index)}
                      className="px-2 py-1 text-red-600 hover:text-red-800 text-sm"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Question
                      </label>
                      <textarea
                        value={item.question}
                        onChange={(e) => updateQuestion(activeTab + '_questions' as keyof typeof formData, index, 'question', e.target.value)}
                        placeholder="Enter the interview question..."
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Your Answer
                      </label>
                      <textarea
                        value={item.answer}
                        onChange={(e) => updateQuestion(activeTab + '_questions' as keyof typeof formData, index, 'answer', e.target.value)}
                        placeholder="Prepare your answer using the STAR method (Situation, Task, Action, Result)..."
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => addQuestion(activeTab + '_questions' as keyof typeof formData)}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                + Add {getCurrentCategory().title} Question
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Questions to Ask the Interviewer */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <HelpCircle className="w-6 h-6 mr-3 text-green-600" />
            Questions to Ask the Interviewer
          </h3>

          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
            <div className="space-y-6">
              {formData.questions_to_ask.map((item, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-800">Question {index + 1}</h4>
                    <button
                      onClick={() => removeQuestion('questions_to_ask', index)}
                      className="px-3 py-1 text-red-600 hover:text-red-800 font-medium"
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Question
                      </label>
                      <textarea
                        value={item.question}
                        onChange={(e) => updateQuestion('questions_to_ask', index, 'question', e.target.value)}
                        placeholder="What question do you want to ask?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Why This Question? (Your Notes)
                      </label>
                      <textarea
                        value={item.reason}
                        onChange={(e) => updateQuestion('questions_to_ask', index, 'reason', e.target.value)}
                        placeholder="Why is this question important? What are you hoping to learn?"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => addQuestion('questions_to_ask')}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                + Add Question to Ask
              </button>
            </div>
          </div>

          {/* Suggested Questions */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h4 className="text-lg font-semibold text-blue-800 mb-4">💡 Suggested Questions to Ask</h4>
            <p className="text-blue-700 text-sm mb-4">
              Click on any question below to add it to your list:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQuestionsToAsk.map((question, index) => (
                <button
                  key={index}
                  onClick={() => addSuggestedQuestionToAsk(question)}
                  className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Interview Tips</h3>
          <div className="text-gray-700 text-sm space-y-2">
            <p><strong>Use the STAR Method:</strong> Structure your answers with Situation, Task, Action, and Result for behavioral questions.</p>
            <p><strong>Show Interest:</strong> Ask questions that demonstrate your genuine interest in the role and company.</p>
            <p><strong>Be Strategic:</strong> Use questions to gather information that will help you make a decision.</p>
            <p><strong>Listen Actively:</strong> Build on their answers with follow-up questions during the interview.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step6Questions;