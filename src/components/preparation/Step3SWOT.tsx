import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, Target, Shield } from 'lucide-react';

interface Step3SWOTProps {
  data: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  onUpdate: (data: any) => void;
}

const Step3SWOT: React.FC<Step3SWOTProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState({
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    opportunities: data.opportunities || [],
    threats: data.threats || []
  });

  const addItem = (category: keyof typeof formData) => {
    const updatedData = {
      ...formData,
      [category]: [...formData[category], '']
    };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const updateItem = (category: keyof typeof formData, index: number, value: string) => {
    const updatedArray = [...formData[category]];
    updatedArray[index] = value;
    const updatedData = {
      ...formData,
      [category]: updatedArray
    };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const removeItem = (category: keyof typeof formData, index: number) => {
    const updatedArray = formData[category].filter((_, i) => i !== index);
    const updatedData = {
      ...formData,
      [category]: updatedArray
    };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const swotCategories = [
    {
      key: 'strengths' as const,
      title: 'Strengths',
      icon: <Shield className="w-6 h-6" />,
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-800',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      description: 'Internal positive factors that give advantages'
    },
    {
      key: 'weaknesses' as const,
      title: 'Weaknesses',
      icon: <AlertTriangle className="w-6 h-6" />,
      color: 'bg-red-50 border-red-200',
      textColor: 'text-red-800',
      buttonColor: 'bg-red-600 hover:bg-red-700',
      description: 'Internal negative factors that need improvement'
    },
    {
      key: 'opportunities' as const,
      title: 'Opportunities',
      icon: <Target className="w-6 h-6" />,
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-800',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      description: 'External positive factors to leverage'
    },
    {
      key: 'threats' as const,
      title: 'Threats',
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-800',
      buttonColor: 'bg-yellow-600 hover:bg-yellow-700',
      description: 'External negative factors to address'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <TrendingUp className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">SWOT Analysis</h2>
          <p className="text-gray-600">
            Analyze the company's internal strengths & weaknesses and external opportunities & threats
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {swotCategories.map((category) => (
            <div
              key={category.key}
              className={`${category.color} border-2 rounded-lg p-6`}
            >
              <div className="flex items-center mb-4">
                <div className={category.textColor}>
                  {category.icon}
                </div>
                <div className="ml-3">
                  <h3 className={`text-xl font-semibold ${category.textColor}`}>
                    {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {formData[category.key].map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateItem(category.key, index, e.target.value)}
                      placeholder={`Enter ${category.title.toLowerCase().slice(0, -1)}...`}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={() => removeItem(category.key, index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 font-medium"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => addItem(category.key)}
                  className={`w-full px-4 py-2 ${category.buttonColor} text-white rounded-md transition-colors font-medium`}
                >
                  + Add {category.title.slice(0, -1)}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 SWOT Analysis Tips</h3>
          <div className="text-blue-700 text-sm space-y-2">
            <p><strong>Strengths:</strong> What does the company do well? What unique resources do they have?</p>
            <p><strong>Weaknesses:</strong> What could the company improve? What resources are they lacking?</p>
            <p><strong>Opportunities:</strong> What trends could benefit the company? What gaps exist in the market?</p>
            <p><strong>Threats:</strong> What trends could harm the company? What is the competition doing?</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3SWOT;