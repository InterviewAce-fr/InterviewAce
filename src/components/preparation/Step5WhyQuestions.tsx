import React, { useState } from 'react';
import { MessageCircle, User, Building, Briefcase } from 'lucide-react';

interface Step5WhyQuestionsProps {
  data: {
    why_you?: string;
    why_them?: string;
    why_this_role?: string;
    elevator_pitch?: string;
  };
  onUpdate: (data: any) => void;
}

const Step5WhyQuestions: React.FC<Step5WhyQuestionsProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState({
    why_you: data.why_you || '',
    why_them: data.why_them || '',
    why_this_role: data.why_this_role || '',
    elevator_pitch: data.elevator_pitch || ''
  });

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const questions = [
    {
      key: 'why_you',
      title: 'Why You?',
      icon: <User className="w-6 h-6" />,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      placeholder: 'What makes you the right candidate for this role? What unique value do you bring?',
      description: 'Focus on your unique strengths, skills, and experiences that set you apart.'
    },
    {
      key: 'why_them',
      title: 'Why Them?',
      icon: <Building className="w-6 h-6" />,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      placeholder: 'Why do you want to work for this specific company? What attracts you to them?',
      description: 'Show your research and genuine interest in their mission, culture, and values.'
    },
    {
      key: 'why_this_role',
      title: 'Why This Role?',
      icon: <Briefcase className="w-6 h-6" />,
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-800',
      placeholder: 'Why are you interested in this specific position? How does it align with your goals?',
      description: 'Connect this role to your career aspirations and professional development.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <MessageCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Why Questions</h2>
          <p className="text-gray-600">
            Prepare compelling answers to the most important interview questions
          </p>
        </div>

        <div className="space-y-8">
          {questions.map((question) => (
            <div
              key={question.key}
              className={`${question.color} border-2 rounded-lg p-6`}
            >
              <div className="flex items-center mb-4">
                <div className={question.textColor}>
                  {question.icon}
                </div>
                <div className="ml-3">
                  <h3 className={`text-xl font-semibold ${question.textColor}`}>
                    {question.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {question.description}
                  </p>
                </div>
              </div>
              
              <textarea
                value={formData[question.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(question.key, e.target.value)}
                placeholder={question.placeholder}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={5}
              />
            </div>
          ))}

          {/* Elevator Pitch */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MessageCircle className="w-6 h-6 text-yellow-600" />
              <div className="ml-3">
                <h3 className="text-xl font-semibold text-yellow-800">
                  30-Second Elevator Pitch
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  A concise summary of who you are and what you bring to the table.
                </p>
              </div>
            </div>
            
            <textarea
              value={formData.elevator_pitch}
              onChange={(e) => handleInputChange('elevator_pitch', e.target.value)}
              placeholder="Craft a compelling 30-second introduction that highlights your key strengths and value proposition..."
              className="w-full px-4 py-3 border border-yellow-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
              rows={4}
            />
          </div>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Answer Tips</h3>
          <div className="text-gray-700 text-sm space-y-2">
            <p><strong>Be Authentic:</strong> Your answers should reflect your genuine motivations and interests.</p>
            <p><strong>Use the STAR Method:</strong> Structure your examples with Situation, Task, Action, and Result.</p>
            <p><strong>Show Research:</strong> Demonstrate that you've done your homework about the company and role.</p>
            <p><strong>Connect to Value:</strong> Always tie your answers back to the value you can provide.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5WhyQuestions;