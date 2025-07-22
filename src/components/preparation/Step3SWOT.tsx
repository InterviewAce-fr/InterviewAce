import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Shield, AlertTriangle, Zap } from 'lucide-react';

interface Step3Props {
  data: any;
  onUpdate: (data: any) => void;
}

const SWOT_SECTIONS = [
  {
    key: 'strengths',
    title: 'Strengths',
    icon: TrendingUp,
    color: 'green',
    description: 'Internal positive factors that give advantages',
    placeholder: 'e.g., Strong brand recognition, innovative technology, skilled workforce...'
  },
  {
    key: 'weaknesses',
    title: 'Weaknesses',
    icon: TrendingDown,
    color: 'red',
    description: 'Internal negative factors that need improvement',
    placeholder: 'e.g., Limited market presence, high costs, outdated systems...'
  },
  {
    key: 'opportunities',
    title: 'Opportunities',
    icon: Shield,
    color: 'blue',
    description: 'External positive factors that can be leveraged',
    placeholder: 'e.g., Market expansion, new technologies, regulatory changes...'
  },
  {
    key: 'threats',
    title: 'Threats',
    icon: AlertTriangle,
    color: 'yellow',
    description: 'External negative factors that pose risks',
    placeholder: 'e.g., Competition, economic downturn, regulatory risks...'
  }
];

export default function Step3SWOT({ data, onUpdate }: Step3Props) {
  const [formData, setFormData] = useState({
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    opportunities: data.opportunities || [],
    threats: data.threats || [],
    ...data
  });

  useEffect(() => {
    onUpdate(formData);
  }, [formData]);

  const handleArrayChange = (section: string, index: number, value: string) => {
    const newArray = [...formData[section as keyof typeof formData]];
    newArray[index] = value;
    setFormData(prev => ({
      ...prev,
      [section]: newArray
    }));
  };

  const addItem = (section: string) => {
    const currentArray = formData[section as keyof typeof formData] || [];
    setFormData(prev => ({
      ...prev,
      [section]: [...currentArray, '']
    }));
  };

  const removeItem = (section: string, index: number) => {
    const newArray = [...formData[section as keyof typeof formData]];
    newArray.splice(index, 1);
    setFormData(prev => ({
      ...prev,
      [section]: newArray
    }));
  };

  const generateWithAI = async () => {
    // This would integrate with your AI service
    alert('AI generation feature coming soon! This will analyze the company and generate a comprehensive SWOT analysis.');
  };

  const getColorClasses = (color: string) => {
    const colorMap = {
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        icon: 'bg-green-100 text-green-600',
        text: 'text-green-800',
        button: 'text-green-600 hover:text-green-800'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        icon: 'bg-red-100 text-red-600',
        text: 'text-red-800',
        button: 'text-red-600 hover:text-red-800'
      },
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        icon: 'bg-blue-100 text-blue-600',
        text: 'text-blue-800',
        button: 'text-blue-600 hover:text-blue-800'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        icon: 'bg-yellow-100 text-yellow-600',
        text: 'text-yellow-800',
        button: 'text-yellow-600 hover:text-yellow-800'
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
            <h2 className="text-xl font-bold text-gray-900 mb-2">SWOT Analysis</h2>
            <p className="text-gray-600">
              Analyze the company's Strengths, Weaknesses, Opportunities, and Threats to understand their strategic position.
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

      {/* SWOT Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SWOT_SECTIONS.map((section) => {
          const IconComponent = section.icon;
          const colors = getColorClasses(section.color);
          const items = formData[section.key as keyof typeof formData] || [];

          return (
            <div key={section.key} className={`${colors.bg} ${colors.border} border-2 rounded-lg p-6`}>
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center`}>
                  <IconComponent className="h-5 w-5" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${colors.text}`}>{section.title}</h3>
                  <p className="text-sm text-gray-600">{section.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                {items.map((item: string, index: number) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayChange(section.key, index, e.target.value)}
                      placeholder={section.placeholder}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                    />
                    <button
                      onClick={() => removeItem(section.key, index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={() => addItem(section.key)}
                  className={`${colors.button} text-sm font-medium transition-colors`}
                >
                  + Add {section.title.slice(0, -1)}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* SWOT Matrix Visualization */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">SWOT Matrix</h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Strengths */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2 flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span>Strengths</span>
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              {(formData.strengths || []).slice(0, 3).map((strength: string, index: number) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-green-500 mt-1">•</span>
                  <span>{strength || 'Add strength...'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Weaknesses */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-800 mb-2 flex items-center space-x-2">
              <TrendingDown className="h-4 w-4" />
              <span>Weaknesses</span>
            </h4>
            <ul className="text-sm text-red-700 space-y-1">
              {(formData.weaknesses || []).slice(0, 3).map((weakness: string, index: number) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{weakness || 'Add weakness...'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Opportunities */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Opportunities</span>
            </h4>
            <ul className="text-sm text-blue-700 space-y-1">
              {(formData.opportunities || []).slice(0, 3).map((opportunity: string, index: number) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{opportunity || 'Add opportunity...'}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Threats */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4" />
              <span>Threats</span>
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              {(formData.threats || []).slice(0, 3).map((threat: string, index: number) => (
                <li key={index} className="flex items-start space-x-1">
                  <span className="text-yellow-500 mt-1">•</span>
                  <span>{threat || 'Add threat...'}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Strategic Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Strategic Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-800 mb-2">How can you help with their strengths?</h4>
            <p className="text-gray-600">Consider how your skills can amplify their existing advantages.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">How can you address their weaknesses?</h4>
            <p className="text-gray-600">Think about how your experience can help overcome their challenges.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">How can you help capture opportunities?</h4>
            <p className="text-gray-600">Identify ways your background aligns with their growth potential.</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-800 mb-2">How can you help mitigate threats?</h4>
            <p className="text-gray-600">Consider how your expertise can help them navigate challenges.</p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for SWOT Analysis</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Research recent news, financial reports, and industry analysis</li>
          <li>• Look at competitor comparisons and market positioning</li>
          <li>• Consider both current state and future trends</li>
          <li>• Think about how your role could impact each quadrant</li>
          <li>• Use this analysis to prepare thoughtful questions and responses</li>
        </ul>
      </div>
    </div>
  );
}