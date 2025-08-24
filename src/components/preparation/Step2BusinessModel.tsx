// src/components/preparation/Step2BusinessModel.tsx
import React, { useState } from 'react';
import { Plus, X, HelpCircle, ChevronUp } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { aiService } from '@/lib/aiService';
import { GhostList } from '@/components/common';
import { useDebouncedSave } from '@/components/hooks';
import { smartSet } from '@/utils/textSet';

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
  companyName?: string;
  companySummary?: string;
}

const Step2BusinessModel: React.FC<Step2BusinessModelProps> = ({ data, onUpdate, companyName, companySummary }) => {
  const [businessModel, setBusinessModel] = useState<BusinessModelData>(() => ({
    keyPartners: Array.isArray(data?.keyPartners) ? data.keyPartners : [],
    keyActivities: Array.isArray(data?.keyActivities) ? data.keyActivities : [],
    keyResources: Array.isArray(data?.keyResources) ? data.keyResources : [],
    valuePropositions: Array.isArray(data?.valuePropositions) ? data.valuePropositions : [],
    customerRelationships: Array.isArray(data?.customerRelationships) ? data.customerRelationships : [],
    channels: Array.isArray(data?.channels) ? data.channels : [],
    customerSegments: Array.isArray(data?.customerSegments) ? data.customerSegments : [],
    costStructure: Array.isArray(data?.costStructure) ? data.costStructure : [],
    revenueStreams: Array.isArray(data?.revenueStreams) ? data.revenueStreams : [],
  }));

  // Debounce save (1s) à chaque modification du modèle
  useDebouncedSave(businessModel, (bm) => {
    if (JSON.stringify(bm) !== JSON.stringify(data)) {
      onUpdate(bm);
      //toast.success('Progress saved');
    }
  }, 1000);

  const sections = [
    { key: 'keyPartners' as const,        title: 'Key Partners',            description: 'Who are your key partners and suppliers?', tips: ['Strategic alliances','Joint ventures','Buyer-supplier relationships','Key suppliers and partners'], gridArea: 'partners' },
    { key: 'keyActivities' as const,      title: 'Key Activities',          description: 'What key activities do your value propositions require?', tips: ['Production and operations','Problem-solving and platform/network','Marketing and sales activities'], gridArea: 'activities' },
    { key: 'keyResources' as const,       title: 'Key Resources',           description: 'What key resources do your value propositions require?', tips: ['Physical assets (infrastructure, equipment)','Intellectual property (brands, patents)','Human resources (talent, expertise)','Financial resources (cash, credit lines)'], gridArea: 'resources' },
    { key: 'valuePropositions' as const,  title: 'Value Propositions',      description: 'What value do you deliver to the customer?', tips: ['Performance & customization','Design & brand','Risk reduction & accessibility','Newness & innovation','Cost reduction and convenience'], gridArea: 'value' },
    { key: 'customerRelationships' as const, title: 'Customer Relationships', description: 'What relationships do you establish with customers?', tips: ['Personal assistance','Dedicated personal assistance','Self-service and co-creation','Automated services and communities'], gridArea: 'relationships' },
    { key: 'channels' as const,           title: 'Channels',                description: 'How do you reach your customers?', tips: ['Owned and partner channels','Online and offline','Direct sales and retail','Wholesale distribution'], gridArea: 'channels' },
    { key: 'customerSegments' as const,   title: 'Customer Segments',       description: 'Who are your most important customers?', tips: ['Mass market','Niche markets','Segmented and diversified markets','Multi-sided platforms'], gridArea: 'segments' },
    { key: 'costStructure' as const,      title: 'Cost Structure',          description: 'What are the major costs in your business?', tips: ['Fixed and variable costs','Economies of scale','Economies of scope'], gridArea: 'costs' },
    { key: 'revenueStreams' as const,     title: 'Revenue Streams',         description: 'How do you earn revenue?', tips: ['Asset sales and usage fees','Subscription fees and brokerage','Licensing and advertising revenue'], gridArea: 'revenue' },
  ];

  const addItem = (sectionKey: keyof BusinessModelData) => {
    setBusinessModel(prev => ({ ...prev, [sectionKey]: [...prev[sectionKey], ''] }));
  };

  const updateItem = (sectionKey: keyof BusinessModelData, index: number, value: string) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removeItem = (sectionKey: keyof BusinessModelData, index: number) => {
    setBusinessModel(prev => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, i) => i !== index),
    }));
  };

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGenerateBMC = async () => {
    try {
      setAiError(null);
      setAiLoading(true);
      const ai = await aiService.generateBusinessModel({
        company_name: companyName,
        companySummary,
        existing: businessModel,
      });
      const next: BusinessModelData = {
        keyPartners: smartSet(businessModel.keyPartners, ai.keyPartners),
        keyActivities: smartSet(businessModel.keyActivities, ai.keyActivities),
        keyResources: smartSet(businessModel.keyResources, ai.keyResources),
        valuePropositions: smartSet(businessModel.valuePropositions, ai.valuePropositions),
        customerRelationships: smartSet(businessModel.customerRelationships, ai.customerRelationships),
        channels: smartSet(businessModel.channels, ai.channels),
        customerSegments: smartSet(businessModel.customerSegments, ai.customerSegments),
        costStructure: smartSet(businessModel.costStructure, ai.costStructure),
        revenueStreams: smartSet(businessModel.revenueStreams, ai.revenueStreams),
      };
      setBusinessModel(next);
      onUpdate(next);
    } catch (e: any) {
      setAiError(e?.message || 'Failed to generate with AI');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Model</h2>
            <p className="text-gray-600">Fill the canvas then use AI to enrich and complete it.</p>
          </div>

          <div>
            <button
              onClick={handleGenerateBMC}
              disabled={aiLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {aiLoading ? 'Generating…' : 'Generate with AI'}
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {sections.map((section) => (
            <section key={section.key} className="border rounded-xl p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">{section.title}</h4>
                  <p className="text-xs text-gray-500">{section.description}</p>
                </div>
                <button
                  className="text-sm px-2 py-1 rounded bg-gray-100 hover:bg-gray-200"
                  onClick={() => addItem(section.key)}
                >
                  <Plus className="w-3 h-3 inline mr-1" /> Add
                </button>
              </div>
              <GhostList
                items={businessModel[section.key]}
                onAdd={() => addItem(section.key)}
                onUpdate={(index, value) => updateItem(section.key, index, value)}
                onRemove={(index) => removeItem(section.key, index)}
                placeholder="Add an item…"
              />
              <div className="mt-2 text-xs text-gray-400">
                <ChevronUp className="inline w-3 h-3" /> Tips: {section.tips.join(' • ')}
              </div>
            </section>
          ))}
        </div>

        {aiError && <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">{aiError}</div>}
      </div>
    </div>
  );
};

export default Step2BusinessModel;
