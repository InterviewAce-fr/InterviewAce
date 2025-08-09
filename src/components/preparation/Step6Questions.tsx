import React, { useState } from 'react';
import { HelpCircle, MessageSquare } from 'lucide-react';

interface Step6QuestionsProps {
  data: {
    questions_to_ask?: Array<{
      question: string;
      answer: string;
    }>;
  };
  onUpdate: (data: any) => void;
}

const Step6Questions: React.FC<Step6QuestionsProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState({
    questions_to_ask: data.questions_to_ask || []
  });

  const addQuestion = () => {
    const updatedQuestions = [...formData.questions_to_ask, { question: '', answer: '' }];
    const updatedData = { questions_to_ask: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const updateQuestion = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedQuestions = [...formData.questions_to_ask];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    const updatedData = { questions_to_ask: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const removeQuestion = (index: number) => {
    const updatedQuestions = formData.questions_to_ask.filter((_, i) => i !== index);
    const updatedData = { questions_to_ask: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const suggestedQuestions = [
    "What does success look like in this role after 6 months?",
    "What are the biggest challenges facing the team right now?",
    "How would you describe the company culture?",
    "What opportunities are there for professional development?",
    "What do you enjoy most about working here?",
    "How does this role contribute to the company's overall goals?",
    "What are the next steps in the interview process?",
    "Can you tell me about the team I'd be working with?"
  ];

  const addSuggestedQuestion = (question: string) => {
    const updatedQuestions = [...formData.questions_to_ask, { question, answer: '' }];
    const updatedData = { questions_to_ask: updatedQuestions };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <HelpCircle className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Interview Questions</h2>
          <p className="text-gray-600">
            Prepare thoughtful questions to ask your interviewer
          </p>
        </div>

        {/* Questions to Ask */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <MessageSquare className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-800">Questions to Ask Them</h3>
          </div>

          <div className="space-y-6">
            {formData.questions_to_ask.map((item, index) => (
              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-800">Question {index + 1}</h4>
                  <button
                    onClick={() => removeQuestion(index)}
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
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="What question do you want to ask?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Why This Question? (Your Notes)
                    </label>
                    <textarea
                      value={item.answer}
                      onChange={(e) => updateQuestion(index, 'answer', e.target.value)}
                      placeholder="Why is this question important? What are you hoping to learn?"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={addQuestion}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Add Question
            </button>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💡 Suggested Questions</h3>
          <p className="text-blue-700 text-sm mb-4">
            Click on any question below to add it to your list:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => addSuggestedQuestion(question)}
                className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm text-gray-700"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Question Tips</h3>
          <div className="text-gray-700 text-sm space-y-2">
            <p><strong>Show Interest:</strong> Ask questions that demonstrate your genuine interest in the role and company.</p>
            <p><strong>Be Strategic:</strong> Use questions to gather information that will help you make a decision.</p>
            <p><strong>Avoid Basics:</strong> Don't ask questions that can be easily answered by reading their website.</p>
            <p><strong>Listen Actively:</strong> Build on their answers with follow-up questions during the interview.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step6Questions;