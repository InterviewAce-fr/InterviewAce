import React from 'react';

interface Step5Data {
  whyCompany: string;
  whyRole: string;
  whyYou: string;
}

interface Step5Props {
  data: Step5Data;
  onUpdate: (data: Step5Data) => void;
}

const Step5WhyQuestions: React.FC<Step5Props> = ({ data, onUpdate }) => {
  const handleChange = (field: keyof Step5Data, value: string) => {
    onUpdate({ ...data, [field]: value });
  };

  const questions = [
    {
      key: 'whyCompany' as keyof Step5Data,
      title: 'Why This Company?',
      placeholder: 'What attracts you to this specific company? Consider their mission, values, culture, products, market position...',
      tips: [
        'Research the company\'s mission, values, and recent achievements',
        'Mention specific products, services, or initiatives that interest you',
        'Connect their goals with your career aspirations',
        'Show knowledge of their market position and competitive advantages'
      ]
    },
    {
      key: 'whyRole' as keyof Step5Data,
      title: 'Why This Role?',
      placeholder: 'What excites you about this specific position? How does it align with your career goals and interests?',
      tips: [
        'Highlight how the role matches your skills and experience',
        'Explain how it fits into your career progression',
        'Mention specific responsibilities that excite you',
        'Connect the role to your long-term professional goals'
      ]
    },
    {
      key: 'whyYou' as keyof Step5Data,
      title: 'Why You?',
      placeholder: 'What unique value do you bring? What makes you the ideal candidate for this position?',
      tips: [
        'Highlight your unique combination of skills and experience',
        'Mention specific achievements that demonstrate your capabilities',
        'Explain how your background solves their specific challenges',
        'Show enthusiasm and cultural fit'
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">The Three Why Questions</h2>
        <p className="text-gray-600">
          Prepare compelling answers to the most fundamental interview questions.
        </p>
      </div>

      <div className="space-y-8">
        {questions.map((question, index) => (
          <div key={question.key} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold mr-3">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-gray-800">{question.title}</h3>
            </div>
            
            <textarea
              value={data[question.key]}
              onChange={(e) => handleChange(question.key, e.target.value)}
              placeholder={question.placeholder}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
            />
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">💡 Answer Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {question.tips.map((tip, tipIndex) => (
                  <li key={tipIndex}>• {tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-3">🎯 Key Strategy:</h4>
        <p className="text-gray-600 mb-3">
          Your answers should create a compelling narrative that shows:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl mb-2">🏢</div>
            <div className="font-medium text-gray-800">Company Fit</div>
            <div className="text-sm text-gray-600">You understand and align with their mission</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl mb-2">🎯</div>
            <div className="font-medium text-gray-800">Role Alignment</div>
            <div className="text-sm text-gray-600">The position matches your career goals</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg">
            <div className="text-2xl mb-2">⭐</div>
            <div className="font-medium text-gray-800">Unique Value</div>
            <div className="text-sm text-gray-600">You bring something special to the table</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5WhyQuestions;