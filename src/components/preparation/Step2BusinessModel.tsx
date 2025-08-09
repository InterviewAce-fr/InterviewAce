import React, { useState, useEffect } from 'react';
import { Building2, Users, DollarSign, Truck, Heart, Key, UserCheck, Handshake, PiggyBank } from 'lucide-react';

interface Step2Data {
  keyPartners: string[];
  keyActivities: string[];
  keyResources: string[];
  valuePropositions: string[];
  customerRelationships: string[];
  channels: string[];
  customerSegments: string[];
  costStructure: string[];
  revenueStreams: string[];
}

interface Step2BusinessModelProps {
  data: Step2Data;
  onDataChange: (data: Step2Data) => void;
}

const Step2BusinessModel: React.FC<Step2BusinessModelProps> = ({ data, onDataChange }) => {
  const [formData, setFormData] = useState<Step2Data>({
    keyPartners: [],
    keyActivities: [],
    keyResources: [],
    valuePropositions: [],
    customerRelationships: [],
    channels: [],
    customerSegments: [],
    costStructure: [],
    revenueStreams: [],
    ...data
  });

  useEffect(() => {
    onDataChange(formData);
  }, [formData, onDataChange]);

  const addItem = (section: keyof Step2Data) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], '']
    }));
  };

  const updateItem = (section: keyof Step2Data, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (section: keyof Step2Data, index: number) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const renderSection = (
    title: string,
    section: keyof Step2Data,
    icon: React.ReactNode,
    placeholder: string,
    bgColor: string = 'bg-blue-50'
  ) => (
    <div className={`${bgColor} border border-gray-200 rounded-lg p-3 flex flex-col min-h-0`}>
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        {icon}
        <h3 className="font-semibold text-xs text-gray-800">{title}</h3>
      </div>
      <div className="flex-1 min-h-0 space-y-2">
        {formData[section].map((item, index) => (
          <div key={index} className="flex gap-1">
            <textarea
              value={item}
              onChange={(e) => updateItem(section, index, e.target.value)}
              placeholder={placeholder}
              className="flex-1 p-2 text-xs border border-gray-300 rounded resize-none"
              style={{ minHeight: '60px' }}
            />
            <button
              onClick={() => removeItem(section, index)}
              className="text-red-500 hover:text-red-700 text-xs px-1"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => addItem(section)}
          className="w-full p-2 text-xs text-blue-600 border border-blue-300 rounded hover:bg-blue-100 transition-colors"
        >
          + Add {title.split(' ')[0]}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Business Model Canvas</h2>
        <p className="text-gray-600">
          Analyze the company's business model to understand how they create, deliver, and capture value
        </p>
      </div>

      {/* Business Model Canvas Grid */}
      <div className="grid grid-cols-5 gap-3 mb-6" style={{ minHeight: '600px' }}>
        {/* Row 1 */}
        <div className="col-span-1">
          {renderSection(
            'Key Partners',
            'keyPartners',
            <Handshake className="w-4 h-4 text-purple-600" />,
            'Who are the key partners and suppliers?',
            'bg-purple-50'
          )}
        </div>
        <div className="col-span-1">
          {renderSection(
            'Key Activities',
            'keyActivities',
            <Building2 className="w-4 h-4 text-orange-600" />,
            'What key activities does the value proposition require?',
            'bg-orange-50'
          )}
        </div>
        <div className="col-span-1 row-span-2">
          {renderSection(
            'Value Propositions',
            'valuePropositions',
            <Heart className="w-4 h-4 text-red-600" />,
            'What value do we deliver to customers?',
            'bg-red-50'
          )}
        </div>
        <div className="col-span-1">
          {renderSection(
            'Customer Relationships',
            'customerRelationships',
            <UserCheck className="w-4 h-4 text-green-600" />,
            'What type of relationship does each customer segment expect?',
            'bg-green-50'
          )}
        </div>
        <div className="col-span-1">
          {renderSection(
            'Customer Segments',
            'customerSegments',
            <Users className="w-4 h-4 text-blue-600" />,
            'For whom are we creating value?',
            'bg-blue-50'
          )}
        </div>

        {/* Row 2 */}
        <div className="col-span-1">
          {renderSection(
            'Key Resources',
            'keyResources',
            <Key className="w-4 h-4 text-yellow-600" />,
            'What key resources does the value proposition require?',
            'bg-yellow-50'
          )}
        </div>
        <div className="col-span-1">
          {/* Empty space for better layout */}
        </div>
        {/* Value Propositions spans this row */}
        <div className="col-span-1">
          {renderSection(
            'Channels',
            'channels',
            <Truck className="w-4 h-4 text-indigo-600" />,
            'Through which channels do we reach customers?',
            'bg-indigo-50'
          )}
        </div>
        <div className="col-span-1">
          {/* Empty space for better layout */}
        </div>

        {/* Row 3 - Cost Structure and Revenue Streams */}
        <div className="col-span-2">
          {renderSection(
            'Cost Structure',
            'costStructure',
            <PiggyBank className="w-4 h-4 text-gray-600" />,
            'What are the most important costs inherent in our business model?',
            'bg-gray-50'
          )}
        </div>
        <div className="col-span-1">
          {/* Empty space */}
        </div>
        <div className="col-span-2">
          {renderSection(
            'Revenue Streams',
            'revenueStreams',
            <DollarSign className="w-4 h-4 text-emerald-600" />,
            'For what value are our customers really willing to pay?',
            'bg-emerald-50'
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Analysis Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Research the company's annual reports, investor presentations, and website</li>
          <li>• Look for partnerships, acquisitions, and strategic alliances</li>
          <li>• Understand their revenue model and pricing strategy</li>
          <li>• Identify their key competitive advantages and differentiators</li>
          <li>• Consider how your role fits into their value creation process</li>
        </ul>
      </div>
    </div>
  );
};

export default Step2BusinessModel;