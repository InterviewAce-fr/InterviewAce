import React, { useState, useEffect } from 'react';
import { MessageCircle, Plus, Trash2, Lightbulb, Zap, HelpCircle } from 'lucide-react';

interface Step6Props {
  data: any;
  onUpdate: (data: any) => void;
}

interface Question {
  id: string;
  question: string;
  category: string;
  answer: string;
  tips: string;
}

const QUESTION_CATEGORIES = [
  { value: 'behavioral', label: 'Behavioral', color: 'blue' },
  { value: 'technical', label: 'Technical', color: 'green' },
  { value: 'situational', label: 'Situational', color: 'purple' },
  { value: 'company', label: 'Company-Specific', color: 'orange' },
  { value: 'career', label: 'Career & Goals', color: 'pink' },
  { value: 'personal', label: 'Personal', color: 'indigo' }
];

const COMMON_QUESTIONS = [
  {
    category: 'behavioral',
    questions: [
      'Tell me about a time when you had to work under pressure.',
      'Describe a situation where you had to resolve a conflict with a colleague.',
      'Give me an example of when you showed leadership.',
      'Tell me about a time you failed and what you learned from it.',
      'Describe a situation where you had to adapt to change quickly.'
    ]
  },
  {
    category: 'technical',
    questions: [
      'Walk me through your approach to solving a complex problem.',
      'How do you stay updated with industry trends and technologies?',
      'Describe your experience with [specific technology/tool].',
      'How would you handle a situation where you don\'t know the answer?',
      'What\'s your process for debugging/troubleshooting?'
    ]
  },
  {
    category: 'situational',
    questions: [
      'How would you handle a tight deadline with competing priorities?',
      'What would you do if you disagreed with your manager\'s decision?',
      'How would you approach learning a new skill required for this role?',
      'What would you do if a project was falling behind schedule?',
      'How would you handle receiving constructive criticism?'
    ]
  },
  {
    category: 'company',
    questions: [
      'What do you know about our company culture?',
      'How do you see yourself fitting into our team?',
      'What interests you most about our products/services?',
      'How would you contribute to our company\'s mission?',
      'What questions do you have about our company?'
    ]
  },
  {
    category: 'career',
    questions: [
      'Where do you see yourself in 5 years?',
      'What are your salary expectations?',
      'Why are you leaving your current position?',
      'What type of work environment do you prefer?',
      'What motivates you in your work?'
    ]
  }
];

export default function Step6Questions({ data, onUpdate }: Step6Props) {
  const [formData, setFormData] = useState({
    questions: data.questions || [],
    questions_to_ask: data.questions_to_ask || [],
    ...data
  });

  const [selectedCategory, setSelectedCategory] = useState('behavioral');

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const addQuestion = (questionText?: string, category?: string) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      question: questionText || '',
      category: category || selectedCategory,
      answer: '',
      tips: ''
    };

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuestion = (id: string, field: keyof Question, value: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q: Question) =>
        q.id === id ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (id: string) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((q: Question) => q.id !== id)
    }));
  };

  const addQuestionToAsk = () => {
    setFormData(prev => ({
      ...prev,
      questions_to_ask: [...prev.questions_to_ask, '']
    }));
  };

  const updateQuestionToAsk = (index: number, value: string) => {
    const newQuestions = [...formData.questions_to_ask];
    newQuestions[index] = value;
    setFormData(prev => ({
      ...prev,
      questions_to_ask: newQuestions
    }));
  };

  const removeQuestionToAsk = (index: number) => {
    const newQuestions = [...formData.questions_to_ask];
    newQuestions.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      questions_to_ask: newQuestions
    }));
  };

  const generateWithAI = async () => {
    // This would integrate with your AI service
    alert('AI generation feature coming soon! This will generate role-specific interview questions and suggested answers.');
  };

  const getCategoryColor = (category: string) => {
    const categoryData = QUESTION_CATEGORIES.find(c => c.value === category);
    return categoryData?.color || 'gray';
  };

  const getCategoryColorClasses = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colorMap[color as keyof typeof colorMap];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Interview Questions & Answers</h2>
            <p className="text-gray-600">
              Prepare for common interview questions and practice your responses.
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

      {/* Question Categories */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Common Questions</h3>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {QUESTION_CATEGORIES.map((category) => (
            <button
              key={category.value}
              onClick={() => setSelectedCategory(category.value)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === category.value
                  ? getCategoryColorClasses(category.color)
                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2">
          {COMMON_QUESTIONS.find(c => c.category === selectedCategory)?.questions.map((question, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-700">{question}</span>
              <button
                onClick={() => addQuestion(question, selectedCategory)}
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Question */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Add Custom Question</h3>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter a custom interview question..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value.trim()) {
                  addQuestion(input.value.trim());
                  input.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Enter a custom interview question..."]') as HTMLInputElement;
              if (input?.value.trim()) {
                addQuestion(input.value.trim());
                input.value = '';
              }
            }}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {formData.questions.map((question: Question, index: number) => {
          const categoryColor = getCategoryColor(question.category);
          const categoryLabel = QUESTION_CATEGORIES.find(c => c.value === question.category)?.label || question.category;
          
          return (
            <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColorClasses(categoryColor)}`}>
                      {categoryLabel}
                    </span>
                    <span className="text-sm text-gray-500">Question {index + 1}</span>
                  </div>
                  <input
                    type="text"
                    value={question.question}
                    onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                    placeholder="Enter the interview question..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                  />
                </div>
                <button
                  onClick={() => removeQuestion(question.id)}
                  className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <textarea
                    value={question.answer}
                    onChange={(e) => updateQuestion(question.id, 'answer', e.target.value)}
                    placeholder="Write your prepared answer using the STAR method (Situation, Task, Action, Result)..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Lightbulb className="inline h-4 w-4 mr-1" />
                    Tips & Notes
                  </label>
                  <textarea
                    value={question.tips}
                    onChange={(e) => updateQuestion(question.id, 'tips', e.target.value)}
                    placeholder="Add any tips, key points to remember, or alternative approaches..."
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          );
        })}

        {formData.questions.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions added yet</h3>
            <p className="text-gray-600 mb-4">Start by adding common questions from the categories above</p>
          </div>
        )}
      </div>

      {/* Questions to Ask */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <HelpCircle className="h-5 w-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Questions to Ask Them</h3>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Prepare thoughtful questions to ask the interviewer. This shows your interest and helps you evaluate the role.
        </p>

        <div className="space-y-2">
          {formData.questions_to_ask.map((question: string, index: number) => (
            <div key={index} className="flex space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => updateQuestionToAsk(index, e.target.value)}
                placeholder="e.g., What does success look like in this role after 6 months?"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
              <button
                onClick={() => removeQuestionToAsk(index)}
                className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <button
            onClick={addQuestionToAsk}
            className="text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
          >
            + Add Question
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Interview Question Tips</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use the STAR method: Situation, Task, Action, Result</li>
          <li>• Practice your answers out loud to improve delivery</li>
          <li>• Prepare 2-3 versions of each answer for different contexts</li>
          <li>• Always have thoughtful questions ready to ask the interviewer</li>
          <li>• Focus on specific examples that demonstrate your skills</li>
        </ul>
      </div>
    </div>
  );
}