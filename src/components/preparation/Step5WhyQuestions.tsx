import React, { useState } from 'react';
import { Zap, Loader2, MessageCircle, Building, User, Target } from 'lucide-react';
import { aiService } from '../../lib/aiService';
import { toast } from '../ui/Toast';

interface Step5Data {
  whyCompany?: string;
  whyRole?: string;
  whyYou?: string;
}

interface Step5Props {
  data: Step5Data;
  onUpdate: (data: Step5Data) => void;
  cvData?: any; // From Step 4
  jobData?: any; // From Step 1
  swotData?: any; // From Step 3
  matchingResults?: any; // From Step 4
}

const Step5WhyQuestions: React.FC<Step5Props> = ({ 
  data, 
  onUpdate, 
  cvData, 
  jobData, 
  swotData, 
  matchingResults 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleChange = (field: keyof Step5Data, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const generateAISuggestions = async () => {
    if (!cvData || !jobData) {
      toast.error('Please complete CV analysis in Step 4 and job analysis in Step 1 first.');
      return;
    }

    setIsGenerating(true);
    
    try {
      const suggestions = await aiService.generateWhySuggestions(
        cvData,
        jobData,
        matchingResults,
        swotData
      );
      
      onUpdate({
        whyCompany: suggestions.whyCompany,
        whyRole: suggestions.whyRole,
        whyYou: suggestions.whyYou
      });
      
      toast.success('AI suggestions generated successfully!');
      
    } catch (error) {
      console.error('Suggestion generation error:', error);
      toast.error('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const questions = [
    {
      id: 'whyYou',
      title: 'Why should we hire you?',
      icon: User,
      placeholder: 'Focus on your unique value proposition, key achievements, and how your skills directly address their needs...',
      description: 'Highlight your strongest matches and unique qualifications that make you the ideal candidate.'
    },
    {
      id: 'whyCompany',
      title: 'Why do you want to work for this company?',
      icon: Building,
      placeholder: 'Research the company\'s mission, values, recent achievements, and explain how they align with your career goals...',
      description: 'Show genuine interest in the company\'s mission, culture, and growth opportunities.'
    },
    {
      id: 'whyRole',
      title: 'Why are you interested in this role?',
      icon: Target,
      placeholder: 'Connect the role\'s responsibilities to your career aspirations and explain how it fits your professional development...',
      description: 'Demonstrate how this position aligns with your career trajectory and interests.'
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Questions</h2>
        <p className="text-gray-600">
          Prepare compelling answers to the most fundamental interview questions.
        </p>
        
        {/* AI Suggestion Button */}
        <div className="mt-4">
          <button
            onClick={generateAISuggestions}
            disabled={isGenerating || !cvData || !jobData}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
            <span>{isGenerating ? 'Generating AI Suggestions...' : 'Generate AI Suggestions'}</span>
          </button>
          <p className="text-sm text-gray-600 mt-2">
            AI will analyze your profile and job data to suggest personalized answers
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {questions.map((question) => {
          const Icon = question.icon;
          return (
            <div key={question.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-lg mr-3">
                  <Icon className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{question.title}</h3>
                  <p className="text-sm text-gray-600">{question.description}</p>
                </div>
              </div>
              
              <textarea
                value={data[question.id as keyof Step5Data] || ''}
                onChange={(e) => handleChange(question.id as keyof Step5Data, e.target.value)}
                placeholder={question.placeholder}
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              
              <div className="mt-3 text-sm text-gray-500">
                <MessageCircle className="inline h-4 w-4 mr-1" />
                Tip: Keep your answer concise (2-3 minutes when spoken) and include specific examples.
              </div>
            </div>
          );
        })}
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Interview Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Use the STAR method (Situation, Task, Action, Result) for behavioral questions
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Quantify your achievements with specific numbers and metrics when possible
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Research the company's recent news, products, and competitors
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Practice your answers out loud to improve delivery and timing
          </li>
          <li className="flex items-start">
            <span className="text-blue-600 mr-2">•</span>
            Prepare thoughtful questions to ask the interviewer about the role and company
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Step5WhyQuestions;