import React, { useState, useEffect } from 'react';
import { Heart, Building, Users, Target, Zap } from 'lucide-react';

interface Step5Props {
  data: any;
  onUpdate: (data: any) => void;
}

const WHY_QUESTIONS = [
  {
    key: 'why_you',
    title: 'Why You?',
    icon: Heart,
    color: 'blue',
    description: 'Why should they hire you over other candidates?',
    prompts: [
      'What unique value do you bring to this role?',
      'What sets you apart from other candidates?',
      'How do your skills and experience make you the ideal fit?',
      'What specific problems can you solve for them?'
    ]
  },
  {
    key: 'why_them',
    title: 'Why Them?',
    icon: Building,
    color: 'green',
    description: 'Why do you want to work for this company?',
    prompts: [
      'What attracts you to this company specifically?',
      'How does their mission align with your values?',
      'What excites you about their products/services?',
      'How do you see yourself contributing to their goals?'
    ]
  },
  {
    key: 'why_now',
    title: 'Why Now?',
    icon: Target,
    color: 'purple',
    description: 'Why is this the right time for this move?',
    prompts: [
      'Why are you looking for a new opportunity now?',
      'How does this role fit your career progression?',
      'What timing factors make this perfect?',
      'How does this align with your current goals?'
    ]
  },
  {
    key: 'why_this_role',
    title: 'Why This Role?',
    icon: Users,
    color: 'orange',
    description: 'Why is this specific position appealing to you?',
    prompts: [
      'What aspects of this role excite you most?',
      'How does this position challenge you?',
      'What growth opportunities do you see?',
      'How does this role utilize your strengths?'
    ]
  }
];

export default function Step5WhyQuestions({ data, onUpdate }: Step5Props) {
  const [formData, setFormData] = useState({
    why_you: data.why_you || '',
    why_them: data.why_them || '',
    why_now: data.why_now || '',
    why_this_role: data.why_this_role || '',
    elevator_pitch: data.elevator_pitch || '',
    ...data
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateWithAI = async () => {
    // This would integrate with your AI service
    alert('AI generation feature coming soon! This will create compelling answers based on your profile and the job analysis.');
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-800'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-600',
        text: 'text-green-800'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        icon: 'bg-purple-100 text-purple-600',
        text: 'text-purple-800'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        icon: 'bg-orange-100 text-orange-600',
        text: 'text-orange-800'
      }
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">The "Why" Questions</h2>
            <p className="text-gray-600">
              Prepare compelling answers to the most important interview questions that show your motivation and fit.
            </p>
          </div>
          <button
            onClick={generateWithAI}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Zap className="h-4 w-4" />
            <span>AI Generate</span>
          </button>
        </div>
      </div>

      {/* Why Questions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {WHY_QUESTIONS.map((question) => {
          const IconComponent = question.icon;
          const colors = getColorClasses(question.color);

          return (
            <div key={question.key} className={`${colors.bg} ${colors.border} border-2 rounded-lg p-6`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{question.title}</h3>
                  <p className="text-sm text-gray-600">{question.description}</p>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Consider these points:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  {question.prompts.map((prompt, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <textarea
                value={formData[question.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(question.key, e.target.value)}
                placeholder={`Write your compelling answer to "${question.title}"...`}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          );
        })}
      </div>

      {/* Elevator Pitch */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-yellow-800">30-Second Elevator Pitch</h3>
            <p className="text-sm text-gray-600">A concise summary combining all your "why" answers</p>
          </div>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Structure your pitch:</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-xs text-gray-600">
            <div className="bg-white rounded p-2 border">
              <strong>Who you are</strong><br />
              Your role/expertise
            </div>
            <div className="bg-white rounded p-2 border">
              <strong>What you do</strong><br />
              Key skills/achievements
            </div>
            <div className="bg-white rounded p-2 border">
              <strong>Why them</strong><br />
              Company connection
            </div>
            <div className="bg-white rounded p-2 border">
              <strong>What's next</strong><br />
              Your goal/ask
            </div>
          </div>
        </div>

        <textarea
          value={formData.elevator_pitch}
          onChange={(e) => handleInputChange('elevator_pitch', e.target.value)}
          placeholder="Craft a compelling 30-second elevator pitch that combines your key strengths, motivation, and fit for this role..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
        />
        
        <div className="mt-2 text-xs text-gray-500">
          Aim for 75-100 words (about 30 seconds when spoken)
        </div>
      </div>

      {/* Answer Quality Checklist */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Answer Quality Checklist</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Strong Answers Include:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Specific examples and evidence</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Connection to company values/goals</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Quantifiable achievements</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Authentic personal motivation</span>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">Avoid:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Generic, templated responses</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Focusing only on what you want</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Negative comments about current/past employers</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                <span>Vague or unsupported claims</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Compelling Answers</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the STAR method (Situation, Task, Action, Result) for examples</li>
          <li>• Research the company thoroughly to make genuine connections</li>
          <li>• Practice your answers out loud to ensure they flow naturally</li>
          <li>• Tailor each answer specifically to this role and company</li>
          <li>• Show enthusiasm and passion - energy is contagious</li>
        </ul>
      </div>
    </div>
  );
}