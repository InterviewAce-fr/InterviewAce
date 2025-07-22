import React, { useState, useEffect } from 'react';
import { HelpCircle, Users, DollarSign, Truck, Heart, Building, Handshake, Zap, Target } from 'lucide-react';

interface Step2Props {
  data: any;
  onUpdate: (data: any) => void;
}

const CANVAS_FIELDS = [
  {
    key: 'key_partners',
    title: 'Key Partners',
    icon: Handshake,
    description: 'Who are the key partners and suppliers?',
    placeholder: 'e.g., Technology vendors, strategic partners, suppliers...'
  },
  {
    key: 'key_activities',
    title: 'Key Activities',
    icon: Target,
    description: 'What key activities does the business model require?',
    placeholder: 'e.g., Software development, marketing, customer support...'
  },
  {
    key: 'key_resources',
    title: 'Key Resources',
    icon: Building,
    description: 'What key resources does the business model require?',
    placeholder: 'e.g., Human resources, technology, intellectual property...'
  },
  {
    key: 'value_propositions',
    title: 'Value Propositions',
    icon: Heart,
    description: 'What value do we deliver to customers?',
    placeholder: 'e.g., Convenience, cost reduction, performance improvement...'
  },
  {
    key: 'customer_relationships',
    title: 'Customer Relationships',
    icon: Users,
    description: 'What type of relationship does each customer segment expect?',
    placeholder: 'e.g., Personal assistance, self-service, automated services...'
  },
  {
    key: 'channels',
    title: 'Channels',
    icon: Truck,
    description: 'Through which channels do we reach our customers?',
    placeholder: 'e.g., Website, mobile app, retail stores, partners...'
  },
  {
    key: 'customer_segments',
    title: 'Customer Segments',
    icon: Users,
    description: 'For whom are we creating value?',
    placeholder: 'e.g., Small businesses, enterprise customers, consumers...'
  },
  {
    key: 'cost_structure',
    title: 'Cost Structure',
    icon: DollarSign,
    description: 'What are the most important costs in our business model?',
    placeholder: 'e.g., Personnel costs, technology infrastructure, marketing...'
  },
  {
    key: 'revenue_streams',
    title: 'Revenue Streams',
    icon: DollarSign,
    description: 'For what value are customers willing to pay?',
    placeholder: 'e.g., Subscription fees, transaction fees, licensing...'
  }
];

export default function Step2BusinessModel({ data, onUpdate }: Step2Props) {
  const [formData, setFormData] = useState({
    key_partners: data.key_partners || '',
    key_activities: data.key_activities || '',
    key_resources: data.key_resources || '',
    value_propositions: data.value_propositions || '',
    customer_relationships: data.customer_relationships || '',
    channels: data.channels || '',
    customer_segments: data.customer_segments || '',
    cost_structure: data.cost_structure || '',
    revenue_streams: data.revenue_streams || '',
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
    alert('AI generation feature coming soon! This will analyze the company and auto-fill the business model canvas.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Business Model Canvas</h2>
            <p className="text-gray-600">
              Understanding the company's business model will help you speak their language during the interview.
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

      {/* Business Model Canvas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {CANVAS_FIELDS.map((field) => {
          const IconComponent = field.icon;
          return (
            <div key={field.key} className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <IconComponent className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{field.title}</h3>
                  <p className="text-xs text-gray-600 mt-1">{field.description}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </div>
              
              <textarea
                value={formData[field.key as keyof typeof formData]}
                onChange={(e) => handleInputChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
              />
            </div>
          );
        })}
      </div>

      {/* Visual Canvas Layout */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Visual Business Model Canvas</h3>
        <div className="grid grid-cols-5 gap-2 text-xs">
          {/* Row 1 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 h-24">
            <div className="font-semibold text-yellow-800 mb-1">Key Partners</div>
            <div className="text-yellow-700 text-xs overflow-hidden">
              {formData.key_partners.substring(0, 50)}...
            </div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded p-2 h-24">
            <div className="font-semibold text-orange-800 mb-1">Key Activities</div>
            <div className="text-orange-700 text-xs overflow-hidden">
              {formData.key_activities.substring(0, 50)}...
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded p-2 h-24">
            <div className="font-semibold text-red-800 mb-1">Value Propositions</div>
            <div className="text-red-700 text-xs overflow-hidden">
              {formData.value_propositions.substring(0, 50)}...
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded p-2 h-24">
            <div className="font-semibold text-purple-800 mb-1">Customer Relationships</div>
            <div className="text-purple-700 text-xs overflow-hidden">
              {formData.customer_relationships.substring(0, 50)}...
            </div>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded p-2 h-24">
            <div className="font-semibold text-pink-800 mb-1">Customer Segments</div>
            <div className="text-pink-700 text-xs overflow-hidden">
              {formData.customer_segments.substring(0, 50)}...
            </div>
          </div>

          {/* Row 2 */}
          <div className="bg-orange-50 border border-orange-200 rounded p-2 h-24">
            <div className="font-semibold text-orange-800 mb-1">Key Resources</div>
            <div className="text-orange-700 text-xs overflow-hidden">
              {formData.key_resources.substring(0, 50)}...
            </div>
          </div>
          <div className="col-span-2 bg-gray-50 border border-gray-200 rounded p-2 h-24 flex items-center justify-center">
            <div className="text-gray-500 text-center">
              <Building className="h-8 w-8 mx-auto mb-1" />
              <div className="font-semibold">Business Model</div>
            </div>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded p-2 h-24">
            <div className="font-semibold text-indigo-800 mb-1">Channels</div>
            <div className="text-indigo-700 text-xs overflow-hidden">
              {formData.channels.substring(0, 50)}...
            </div>
          </div>
          <div className="bg-pink-50 border border-pink-200 rounded p-2 h-24">
            <div className="font-semibold text-pink-800 mb-1">Customer Segments</div>
            <div className="text-pink-700 text-xs overflow-hidden">
              {formData.customer_segments.substring(0, 50)}...
            </div>
          </div>

          {/* Row 3 */}
          <div className="col-span-2 bg-green-50 border border-green-200 rounded p-2 h-24">
            <div className="font-semibold text-green-800 mb-1">Cost Structure</div>
            <div className="text-green-700 text-xs overflow-hidden">
              {formData.cost_structure.substring(0, 100)}...
            </div>
          </div>
          <div className="col-span-3 bg-blue-50 border border-blue-200 rounded p-2 h-24">
            <div className="font-semibold text-blue-800 mb-1">Revenue Streams</div>
            <div className="text-blue-700 text-xs overflow-hidden">
              {formData.revenue_streams.substring(0, 100)}...
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">💡 Tips for Business Model Analysis</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Research the company's website, annual reports, and investor presentations</li>
          <li>• Look for information about their target customers and market positioning</li>
          <li>• Understand how they make money and what their main cost drivers are</li>
          <li>• Consider how your role would contribute to their business model</li>
          <li>• Use this knowledge to ask intelligent questions during the interview</li>
        </ul>
      </div>
    </div>
  );
}