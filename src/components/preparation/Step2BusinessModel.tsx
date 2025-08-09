import React, { useState, useEffect } from 'react';
import { Plus, X, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface BusinessModelData {
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
  data: BusinessModelData;
  onUpdate: (data: BusinessModelData) => void;
}

const Step2BusinessModel: React.FC<Step2BusinessModelProps> = ({ data, onUpdate }) => {
  const [businessModel, setBusinessModel] = useState<BusinessModelData>({
    keyPartners: Array.isArray(data?.keyPartners) ? data.keyPartners : [],
    keyActivities: Array.isArray(data?.keyActivities) ? data.keyActivities : [],
    keyResources: Array.isArray(data?.keyResources) ? data.keyResources : [],
    valuePropositions: Array.isArray(data?.valuePropositions) ? data.valuePropositions : [],
    customerRelationships: Array.isArray(data?.customerRelationships) ? data.customerRelationships : [],
    channels: Array.isArray(data?.channels) ? data.channels : [],
    customerSegments: Array.isArray(data?.customerSegments) ? data.customerSegments : [],
    costStructure: Array.isArray(data?.costStructure) ? data.costStructure : [],
    revenueStreams: Array.isArray(data?.revenueStreams) ? data.revenueStreams : []
  });

  useEffect(() => {
    onUpdate(businessModel);
  }, [businessModel, onUpdate]);

  const sections = [
    {
      key: 'keyPartners' as keyof BusinessModelData,
      title: 'Key Partners',
      description: 'Who are your key partners and suppliers?',
      tips: [
        'Strategic alliances between competitors',
        'Joint ventures to develop new businesses',
        'Buyer-supplier relationships',
        'Key suppliers and partners'
      ],
      gridArea: 'partners'
    },
    {
      key: 'keyActivities' as keyof BusinessModelData,
      title: 'Key Activities',
      description: 'What key activities does your value proposition require?',
      tips: [
        'Production activities',
        'Problem-solving activities',
        'Platform/network activities',
        'Marketing and sales activities'
      ],
      gridArea: 'activities'
    },
    {
      key: 'keyResources' as keyof BusinessModelData,
      title: 'Key Resources',
      description: 'What key resources does your value proposition require?',
      tips: [
        'Physical resources (facilities, equipment)',
        'Intellectual resources (patents, copyrights)',
        'Human resources (skilled employees)',
        'Financial resources (cash, credit lines)'
      ],
      gridArea: 'resources'
    },
    {
      key: 'valuePropositions' as keyof BusinessModelData,
      title: 'Value Propositions',
      description: 'What value do you deliver to customers?',
      tips: [
        'Newness and innovation',
        'Performance improvements',
        'Customization and personalization',
        'Cost reduction and convenience'
      ],
      gridArea: 'value'
    },
    {
      key: 'customerRelationships' as keyof BusinessModelData,
      title: 'Customer Relationships',
      description: 'What type of relationship do you establish with customers?',
      tips: [
        'Personal assistance',
        'Dedicated personal assistance',
        'Self-service platforms',
        'Automated services and communities'
      ],
      gridArea: 'relationships'
    },
    {
      key: 'channels' as keyof BusinessModelData,
      title: 'Channels',
      description: 'Through which channels do you reach customers?',
      tips: [
        'Direct sales channels',
        'Web sales and online platforms',
        'Partner stores and retail',
        'Wholesale distribution'
      ],
      gridArea: 'channels'
    },
    {
      key: 'customerSegments' as keyof BusinessModelData,
      title: 'Customer Segments',
      description: 'For whom are you creating value?',
      tips: [
        'Mass market segments',
        'Niche market segments',
        'Segmented markets',
        'Multi-sided platforms'
      ],
      gridArea: 'segments'
    },
    {
      key: 'costStructure' as keyof BusinessModelData,
      title: 'Cost Structure',
      description: 'What are the most important costs in your business model?',
      tips: [
        'Fixed costs (salaries, rent)',
        'Variable costs (materials, utilities)',
        'Economies of scale',
        'Economies of scope'
      ],
      gridArea: 'costs'
    },
    {
      key: 'revenueStreams' as keyof BusinessModelData,
      title: 'Revenue Streams',
      description: 'For what value are customers willing to pay?',
      tips: [
        'Asset sale revenue',
        'Usage fee revenue',
        'Subscription fee revenue',
        'Licensing and advertising revenue'
      ],
      gridArea: 'revenue'
    }
  ];

  const addItem = (sectionKey: keyof BusinessModelData) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], '']
    }));
  };

  const updateItem = (sectionKey: keyof BusinessModelData, index: number, value: string) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((item, i) => i === index ? value : item)
    }));
  };

  const removeItem = (sectionKey: keyof BusinessModelData, index: number) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Business Model Canvas</h2>
        <p className="text-lg text-gray-600">
          Map out your business model using the nine key building blocks. This will help you understand 
          how the company creates, delivers, and captures value.
        </p>
      </div>

      <div className="grid grid-cols-5 grid-rows-3 gap-4 h-[800px]" style={{
        gridTemplateAreas: `
          "partners activities value relationships segments"
          "partners resources value channels segments"
          "costs costs revenue revenue revenue"
        `
      }}>
        {sections.map((section) => (
          <BusinessModelSection
            key={section.key}
            section={section}
            items={businessModel[section.key] || []}
            onAddItem={() => addItem(section.key)}
            onUpdateItem={(index, value) => updateItem(section.key, index, value)}
            onRemoveItem={(index) => removeItem(section.key, index)}
          />
        ))}
      </div>
    </div>
  );
};

interface BusinessModelSectionProps {
  section: {
    key: keyof BusinessModelData;
    title: string;
    description: string;
    tips: string[];
    gridArea: string;
  };
  items: string[];
  onAddItem: () => void;
  onUpdateItem: (index: number, value: string) => void;
  onRemoveItem: (index: number) => void;
}

const BusinessModelSection: React.FC<BusinessModelSectionProps> = ({
  section,
  items,
  onAddItem,
  onUpdateItem,
  onRemoveItem
}) => {
  const [showTips, setShowTips] = useState(false);

  return (
    <div 
      className="bg-white border-2 border-gray-200 rounded-lg p-4 flex flex-col"
      style={{ gridArea: section.gridArea }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-3">{section.description}</p>

      {showTips && (
        <div className="mb-3 p-2 bg-blue-50 rounded border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">Tips:</span>
            <button
              onClick={() => setShowTips(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          <ul className="text-xs text-blue-600 space-y-1">
            {section.tips.map((tip, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex-1 space-y-2 mb-3">
        {(items || []).map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={item}
              onChange={(e) => onUpdateItem(index, e.target.value)}
              className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter item..."
            />
            <button
              onClick={() => onRemoveItem(index)}
              className="text-red-400 hover:text-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={onAddItem}
        className="flex items-center justify-center space-x-1 px-3 py-2 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span>Add Item</span>
      </button>
    </div>
  );
};

export default Step2BusinessModel;