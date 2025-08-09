import React, { useState, useEffect } from 'react';
import { Building2, Users, Heart, DollarSign, Truck, Handshake, Wrench, Package, TrendingUp } from 'lucide-react';

interface Step2Props {
  data: any;
  onUpdate: (data: any) => void;
}

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

const Step2BusinessModel: React.FC<Step2Props> = ({ data, onUpdate }) => {
  const [businessModel, setBusinessModel] = useState<BusinessModelData>({
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
    onUpdate(businessModel);
  }, [businessModel, onUpdate]);

  const addItem = (section: keyof BusinessModelData, item: string) => {
    if (item.trim()) {
      setBusinessModel(prev => ({
        ...prev,
        [section]: [...prev[section], item.trim()]
      }));
    }
  };

  const removeItem = (section: keyof BusinessModelData, index: number) => {
    setBusinessModel(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const BusinessModelSection = ({ 
    title, 
    section, 
    icon: Icon, 
    placeholder, 
    bgColor,
    tips 
  }: {
    title: string;
    section: keyof BusinessModelData;
    icon: any;
    placeholder: string;
    bgColor: string;
    tips: string[];
  }) => {
    const [newItem, setNewItem] = useState('');

    const handleAdd = () => {
      addItem(section, newItem);
      setNewItem('');
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleAdd();
      }
    };

    return (
      <div className={`${bgColor} p-3 rounded-lg border h-full flex flex-col`}>
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-4 h-4" />
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        
        <div className="flex-1 mb-3">
          <div className="space-y-1 mb-2 max-h-32 overflow-y-auto">
            {businessModel[section].map((item, index) => (
              <div key={index} className="flex items-center justify-between bg-white/50 p-2 rounded text-xs">
                <span className="flex-1">{item}</span>
                <button
                  onClick={() => removeItem(section, index)}
                  className="text-red-500 hover:text-red-700 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex gap-1">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="flex-1 px-2 py-1 border rounded text-xs"
            />
            <button
              onClick={handleAdd}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              +
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <p className="font-medium mb-1">Research tips:</p>
          <ul className="space-y-1">
            {tips.map((tip, index) => (
              <li key={index} className="text-xs">• {tip}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Business Model Canvas</h2>
        <p className="text-gray-600">
          Analyze the company's business model to understand how they create, deliver, and capture value.
        </p>
      </div>

      <div className="grid grid-cols-5 gap-4 h-[600px]">
        {/* Column 1 */}
        <div className="space-y-4">
          <BusinessModelSection
            title="Key Partners"
            section="keyPartners"
            icon={Handshake}
            placeholder="Add partner..."
            bgColor="bg-purple-50"
            tips={[
              "Strategic alliances",
              "Joint ventures", 
              "Supplier relationships",
              "Key acquisitions"
            ]}
          />
          <BusinessModelSection
            title="Key Activities"
            section="keyActivities"
            icon={Wrench}
            placeholder="Add activity..."
            bgColor="bg-orange-50"
            tips={[
              "Production activities",
              "Problem solving",
              "Platform/network",
              "Core processes"
            ]}
          />
          <BusinessModelSection
            title="Key Resources"
            section="keyResources"
            icon={Package}
            placeholder="Add resource..."
            bgColor="bg-green-50"
            tips={[
              "Physical assets",
              "Intellectual property",
              "Human resources",
              "Financial resources"
            ]}
          />
        </div>

        {/* Column 2 - Value Propositions (spans 2 rows) */}
        <div className="row-span-2">
          <BusinessModelSection
            title="Value Propositions"
            section="valuePropositions"
            icon={Heart}
            placeholder="Add value prop..."
            bgColor="bg-red-50"
            tips={[
              "Newness/innovation",
              "Performance improvement",
              "Customization",
              "Getting the job done",
              "Design & brand",
              "Price & cost reduction",
              "Risk reduction",
              "Accessibility",
              "Convenience/usability"
            ]}
          />
        </div>

        {/* Column 3 */}
        <div className="space-y-4">
          <BusinessModelSection
            title="Customer Relationships"
            section="customerRelationships"
            icon={Users}
            placeholder="Add relationship..."
            bgColor="bg-blue-50"
            tips={[
              "Personal assistance",
              "Dedicated support",
              "Self-service",
              "Automated services",
              "Communities",
              "Co-creation"
            ]}
          />
          <BusinessModelSection
            title="Channels"
            section="channels"
            icon={Truck}
            placeholder="Add channel..."
            bgColor="bg-indigo-50"
            tips={[
              "Sales force",
              "Web sales",
              "Own stores",
              "Partner stores",
              "Wholesaler"
            ]}
          />
        </div>

        {/* Column 4 */}
        <div>
          <BusinessModelSection
            title="Customer Segments"
            section="customerSegments"
            icon={Building2}
            placeholder="Add segment..."
            bgColor="bg-teal-50"
            tips={[
              "Mass market",
              "Niche market", 
              "Segmented",
              "Diversified",
              "Multi-sided platforms"
            ]}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <BusinessModelSection
          title="Cost Structure"
          section="costStructure"
          icon={DollarSign}
          placeholder="Add cost..."
          bgColor="bg-yellow-50"
          tips={[
            "Fixed costs",
            "Variable costs",
            "Economies of scale",
            "Economies of scope"
          ]}
        />
        <BusinessModelSection
          title="Revenue Streams"
          section="revenueStreams"
          icon={TrendingUp}
          placeholder="Add revenue..."
          bgColor="bg-emerald-50"
          tips={[
            "Asset sale",
            "Usage fee",
            "Subscription",
            "Lending/leasing",
            "Licensing",
            "Brokerage fees",
            "Advertising"
          ]}
        />
      </div>
    </div>
  );
};

export default Step2BusinessModel;