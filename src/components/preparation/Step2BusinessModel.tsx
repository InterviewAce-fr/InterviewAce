import React, { useState, useEffect } from 'react';
import { Plus, X, HelpCircle } from 'lucide-react';

interface Step2BusinessModelProps {
  data: any;
  onUpdate: (data: any) => void;
}

const Step2BusinessModel: React.FC<Step2BusinessModelProps> = ({ data, onUpdate }) => {
  const [businessModel, setBusinessModel] = useState({
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

  const [showTips, setShowTips] = useState<string | null>(null);

  useEffect(() => {
    onUpdate(businessModel);
  }, [businessModel, onUpdate]);

  const sections = [
    {
      key: 'keyPartners',
      title: 'Key Partners',
      description: 'Who are your key partners and suppliers?',
      tips: [
        'Strategic alliances between competitors',
        'Joint ventures to develop new businesses',
        'Buyer-supplier relationships',
        'Partnerships to optimize and achieve economies of scale'
      ]
    },
    {
      key: 'keyActivities',
      title: 'Key Activities',
      description: 'What key activities does your value proposition require?',
      tips: [
        'Production activities',
        'Problem-solving activities',
        'Platform/network activities',
        'Marketing and sales activities'
      ]
    },
    {
      key: 'keyResources',
      title: 'Key Resources',
      description: 'What key resources does your value proposition require?',
      tips: [
        'Physical resources (facilities, equipment)',
        'Intellectual resources (patents, copyrights)',
        'Human resources (skilled employees)',
        'Financial resources (cash, credit lines)'
      ]
    },
    {
      key: 'valuePropositions',
      title: 'Value Propositions',
      description: 'What value do you deliver to customers?',
      tips: [
        'Newness and innovation',
        'Performance improvements',
        'Customization and personalization',
        'Cost reduction and convenience'
      ]
    },
    {
      key: 'customerRelationships',
      title: 'Customer Relationships',
      description: 'What type of relationship do you establish with customers?',
      tips: [
        'Personal assistance',
        'Dedicated personal assistance',
        'Self-service platforms',
        'Automated services and communities'
      ]
    },
    {
      key: 'channels',
      title: 'Channels',
      description: 'Through which channels do you reach customers?',
      tips: [
        'Direct sales channels',
        'Web sales and online platforms',
        'Partner stores and retail',
        'Wholesale distribution'
      ]
    },
    {
      key: 'customerSegments',
      title: 'Customer Segments',
      description: 'For whom are you creating value?',
      tips: [
        'Mass market segments',
        'Niche market segments',
        'Segmented markets',
        'Multi-sided platforms'
      ]
    },
    {
      key: 'costStructure',
      title: 'Cost Structure',
      description: 'What are the most important costs in your business model?',
      tips: [
        'Fixed costs (salaries, rent)',
        'Variable costs (materials, utilities)',
        'Economies of scale',
        'Economies of scope'
      ]
    },
    {
      key: 'revenueStreams',
      title: 'Revenue Streams',
      description: 'For what value are customers willing to pay?',
      tips: [
        'Asset sale (selling ownership)',
        'Usage fee (pay-per-use)',
        'Subscription fees',
        'Licensing and advertising'
      ]
    }
  ];

  const addItem = (sectionKey: string) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: [...(prev[sectionKey] || []), '']
    }));
  };

  const updateItem = (sectionKey: string, index: number, value: string) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((item: string, i: number) => 
        i === index ? value : item
      )
    }));
  };

  const removeItem = (sectionKey: string, index: number) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_: any, i: number) => i !== index)
    }));
  };

  const BusinessModelSection: React.FC<{
    section: any;
    businessModel: any;
    addItem: (key: string) => void;
    updateItem: (key: string, index: number, value: string) => void;
    removeItem: (key: string, index: number) => void;
    showTips: string | null;
    setShowTips: (key: string | null) => void;
  }> = ({ section, businessModel, addItem, updateItem, removeItem, showTips, setShowTips }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-200 h-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-sm">{section.title}</h3>
        <button
          onClick={() => setShowTips(showTips === section.key ? null : section.key)}
          className="text-gray-400 hover:text-blue-600 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
      
      <p className="text-xs text-gray-600 mb-3">{section.description}</p>
      
      {showTips === section.key && (
        <div className="mb-3 p-2 bg-blue-50 rounded text-xs">
          <ul className="space-y-1">
            {section.tips.map((tip: string, index: number) => (
              <li key={index} className="text-blue-700">• {tip}</li>
            ))}
          </ul>
        </div>
      )}
      
      <div className="space-y-2 mb-3">
        {(businessModel[section.key] || []).map((item: string, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(section.key, index, e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter item..."
            />
            <button
              onClick={() => removeItem(section.key, index)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>
      
      <button
        onClick={() => addItem(section.key)}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add Item
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Business Model Canvas</h2>
        <p className="text-gray-600">
          Analyze the company's business model to understand how they create, deliver, and capture value.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 min-h-[600px]">
        {/* Row 1 */}
        <BusinessModelSection
          section={sections[0]}
          businessModel={businessModel}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
          showTips={showTips}
          setShowTips={setShowTips}
        />
        <BusinessModelSection
          section={sections[1]}
          businessModel={businessModel}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
          showTips={showTips}
          setShowTips={setShowTips}
        />
        <BusinessModelSection
          section={sections[3]}
          businessModel={businessModel}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
          showTips={showTips}
          setShowTips={setShowTips}
        />
        <BusinessModelSection
          section={sections[4]}
          businessModel={businessModel}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
          showTips={showTips}
          setShowTips={setShowTips}
        />
        <BusinessModelSection
          section={sections[6]}
          businessModel={businessModel}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
          showTips={showTips}
          setShowTips={setShowTips}
        />

        {/* Row 2 */}
        <BusinessModelSection
          section={sections[2]}
          businessModel={businessModel}
          addItem={addItem}
          updateItem={updateItem}
          removeItem={removeItem}
          showTips={showTips}
          setShowTips={setShowTips}
        />
        <div className="col-span-3 grid grid-cols-1 gap-4">
          <BusinessModelSection
            section={sections[5]}
            businessModel={businessModel}
            addItem={addItem}
            updateItem={updateItem}
            removeItem={removeItem}
            showTips={showTips}
            setShowTips={setShowTips}
          />
        </div>
        <div></div>

        {/* Row 3 */}
        <div className="col-span-2">
          <BusinessModelSection
            section={sections[7]}
            businessModel={businessModel}
            addItem={addItem}
            updateItem={updateItem}
            removeItem={removeItem}
            showTips={showTips}
            setShowTips={setShowTips}
          />
        </div>
        <div className="col-span-3">
          <BusinessModelSection
            section={sections[8]}
            businessModel={businessModel}
            addItem={addItem}
            updateItem={updateItem}
            removeItem={removeItem}
            showTips={showTips}
            setShowTips={setShowTips}
          />
        </div>
      </div>
    </div>
  );
};

export default Step2BusinessModel;