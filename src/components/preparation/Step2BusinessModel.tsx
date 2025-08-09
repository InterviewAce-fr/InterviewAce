import React, { useState } from 'react';
import { Building2, Users, DollarSign, Truck, Heart, Key, Zap, Target, CreditCard } from 'lucide-react';

interface Step2BusinessModelProps {
  data: {
    key_partners?: string;
    key_activities?: string;
    key_resources?: string;
    value_propositions?: string;
    customer_relationships?: string;
    channels?: string;
    customer_segments?: string;
    cost_structure?: string;
    revenue_streams?: string;
  };
  onUpdate: (data: any) => void;
}

const Step2BusinessModel: React.FC<Step2BusinessModelProps> = ({ data, onUpdate }) => {
  const [formData, setFormData] = useState({
    key_partners: data.key_partners || '',
    key_activities: data.key_activities || '',
    key_resources: data.key_resources || '',
    value_propositions: data.value_propositions || '',
    customer_relationships: data.customer_relationships || '',
    channels: data.channels || '',
    customer_segments: data.customer_segments || '',
    cost_structure: data.cost_structure || '',
    revenue_streams: data.revenue_streams || ''
  });

  const handleInputChange = (field: string, value: string) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    onUpdate(updatedData);
  };

  const canvasItems = [
    {
      key: 'key_partners',
      title: 'Key Partners',
      icon: <Users className="w-5 h-5" />,
      placeholder: 'Who are the key partners and suppliers?',
      color: 'bg-yellow-50 border-yellow-200',
      gridClass: 'row-span-2'
    },
    {
      key: 'key_activities',
      title: 'Key Activities',
      icon: <Zap className="w-5 h-5" />,
      placeholder: 'What key activities does the value proposition require?',
      color: 'bg-orange-50 border-orange-200',
      gridClass: 'row-span-2'
    },
    {
      key: 'value_propositions',
      title: 'Value Propositions',
      icon: <Target className="w-5 h-5" />,
      placeholder: 'What value do we deliver to customers?',
      color: 'bg-red-50 border-red-200',
      gridClass: 'row-span-2'
    },
    {
      key: 'customer_relationships',
      title: 'Customer Relationships',
      icon: <Heart className="w-5 h-5" />,
      placeholder: 'What type of relationship does each customer segment expect?',
      color: 'bg-purple-50 border-purple-200',
      gridClass: 'row-span-2'
    },
    {
      key: 'customer_segments',
      title: 'Customer Segments',
      icon: <Users className="w-5 h-5" />,
      placeholder: 'For whom are we creating value?',
      color: 'bg-pink-50 border-pink-200',
      gridClass: 'row-span-2'
    },
    {
      key: 'key_resources',
      title: 'Key Resources',
      icon: <Key className="w-5 h-5" />,
      placeholder: 'What key resources does the value proposition require?',
      color: 'bg-orange-50 border-orange-200',
      gridClass: ''
    },
    {
      key: 'channels',
      title: 'Channels',
      icon: <Truck className="w-5 h-5" />,
      placeholder: 'Through which channels do we reach customers?',
      color: 'bg-indigo-50 border-indigo-200',
      gridClass: ''
    },
    {
      key: 'cost_structure',
      title: 'Cost Structure',
      icon: <DollarSign className="w-5 h-5" />,
      placeholder: 'What are the most important costs in our business model?',
      color: 'bg-green-50 border-green-200',
      gridClass: 'col-span-2'
    },
    {
      key: 'revenue_streams',
      title: 'Revenue Streams',
      icon: <CreditCard className="w-5 h-5" />,
      placeholder: 'For what value are customers willing to pay?',
      color: 'bg-blue-50 border-blue-200',
      gridClass: 'col-span-3'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Business Model Canvas</h2>
          <p className="text-gray-600">
            Understand how the company creates, delivers, and captures value
          </p>
        </div>

        <div className="grid grid-cols-5 grid-rows-4 gap-4 h-[800px]">
          {canvasItems.map((item) => (
            <div
              key={item.key}
              className={`${item.color} ${item.gridClass} border-2 rounded-lg p-4 flex flex-col`}
            >
              <div className="flex items-center mb-3">
                {item.icon}
                <h3 className="font-semibold text-gray-800 ml-2 text-sm">{item.title}</h3>
              </div>
              <textarea
                value={formData[item.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(item.key, e.target.value)}
                placeholder={item.placeholder}
                className="flex-1 bg-transparent border-none resize-none focus:outline-none text-sm text-gray-700 placeholder-gray-500"
                rows={4}
              />
            </div>
          ))}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">💡 Understanding the Business Model</h3>
          <p className="text-blue-700 text-sm leading-relaxed">
            The Business Model Canvas helps you understand how the company operates and creates value. 
            This knowledge will help you ask better questions during the interview and demonstrate 
            your understanding of their business strategy.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step2BusinessModel;