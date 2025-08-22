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
}

const Step2BusinessModel: React.FC<Step2BusinessModelProps> = ({ data, onUpdate, companyName }) => {
  const [businessModel, setBusinessModel] = useState<BusinessModelData>({
    keyPartners: Array.isArray(data?.keyPartners) ? data.keyPartners : [],
    keyActivities: Array.isArray(data?.keyActivities) ? data.keyActivities : [],
    keyResources: Array.isArray(data?.keyResources) ? data.keyResources : [],
    valuePropositions: Array.isArray(data?.valuePropositions) ? data.valuePropositions : [],
    customerRelationships: Array.isArray(data?.customerRelationships) ? data.customerRelationships : [],
    channels: Array.isArray(data?.channels) ? data.channels : [],
    customerSegments: Array.isArray(data?.customerSegments) ? data.customerSegments : [],
    costStructure: Array.isArray(data?.costStructure) ? data.costStructure : [],
    revenueStreams: Array.isArray(data?.revenueStreams) ? data.revenueStreams : [],
  });

  // Debounce save (1s) à chaque modification du modèle
  useDebouncedSave(businessModel, (bm) => {
    onUpdate(bm);
    toast.success('Progress saved');
  }, 1000);

  const sections = [
    { key: 'keyPartners' as const,        title: 'Key Partners',            description: 'Who are your key partners and suppliers?', tips: ['Strategic alliances between competitors','Joint ventures to develop new businesses','Buyer-supplier relationships','Key suppliers and partners'], gridArea: 'partners' },
    { key: 'keyActivities' as const,      title: 'Key Activities',          description: 'What key activities does your value proposition require?', tips: ['Production activities','Problem-solving activities','Platform/network activities','Marketing and sales activities'], gridArea: 'activities' },
    { key: 'keyResources' as const,       title: 'Key Resources',           description: 'What key resources does your value proposition require?', tips: ['Physical resources (facilities, equipment)','Intellectual resources (patents, copyrights)','Human resources (skilled employees)','Financial resources (cash, credit lines)'], gridArea: 'resources' },
    { key: 'valuePropositions' as const,  title: 'Value Propositions',      description: 'What value do you deliver to customers?', tips: ['Newness and innovation','Performance improvements','Customization and personalization','Cost reduction and convenience'], gridArea: 'value' },
    { key: 'customerRelationships' as const, title: 'Customer Relationships', description: 'What type of relationship do you establish with customers?', tips: ['Personal assistance','Dedicated personal assistance','Self-service platforms','Automated services and communities'], gridArea: 'relationships' },
    { key: 'channels' as const,           title: 'Channels',                description: 'Through which channels do you reach customers?', tips: ['Direct sales channels','Web sales and online platforms','Partner stores and retail','Wholesale distribution'], gridArea: 'channels' },
    { key: 'customerSegments' as const,   title: 'Customer Segments',       description: 'For whom are you creating value?', tips: ['Mass market segments','Niche market segments','Segmented markets','Multi-sided platforms'], gridArea: 'segments' },
    { key: 'costStructure' as const,      title: 'Cost Structure',          description: 'What are the most important costs in your business model?', tips: ['Fixed costs (salaries, rent)','Variable costs (materials, utilities)','Economies of scale','Economies of scope'], gridArea: 'costs' },
    { key: 'revenueStreams' as const,     title: 'Revenue Streams',         description: 'For what value are customers willing to pay?', tips: ['Asset sale revenue','Usage fee revenue','Subscription fee revenue','Licensing and advertising revenue'], gridArea: 'revenue' },
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
      toast.success('Pré‑remplissage IA effectué');
    } catch (e: any) {
      setAiError(e?.message || 'Une erreur est survenue');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Business Model Canvas</h2>
          <p className="text-lg text-gray-600">Map out your business model using the nine key building blocks...</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleGenerateBMC}
            disabled={aiLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {aiLoading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            Generate
          </button>
          {aiError && <span className="text-sm text-red-600">{aiError}</span>}
        </div>
      </div>

      <div
        className="grid gap-4 auto-rows-fr min-h-0 md:grid-cols-3 xl:grid-cols-5"
        style={{
          gridTemplateAreas: `
            "partners activities value relationships segments"
            "partners resources  value channels      segments"
            "costs    costs      revenue revenue      revenue"
          `,
        }}
      >
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
  onRemoveItem,
}) => {
  const [showTips, setShowTips] = React.useState(false);

  return (
    <div
      className="relative bg-white border-2 border-gray-200 rounded-xl p-4 flex flex-col overflow-hidden min-h-0"
      style={{ gridArea: section.gridArea }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <h3 className="font-semibold text-gray-900 text-sm">{section.title}</h3>
        <button
          onClick={() => setShowTips(!showTips)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Show tips"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-gray-600 mb-2 shrink-0">{section.description}</p>

      {/* Tips */}
      {showTips && (
        <div className="mb-2 p-2 bg-blue-50 rounded-lg border shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-blue-700">Tips</span>
            <button onClick={() => setShowTips(false)} className="text-blue-400 hover:text-blue-600">
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
          <ul className="text-xs text-blue-700 space-y-1">
            {section.tips.map((tip, i) => (
              <li key={i} className="flex items-start">
                <span className="mr-1">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Liste d’items (scrollable) */}
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        <GhostList
          items={items}
          onUpdate={(i, v) => onUpdateItem(i, v)}
          onRemove={(i) => onRemoveItem(i)}
          placeholder="Ajouter un élément…"
        />
      </div>

      {/* Footer (toujours dans la carte) */}
      <div className="pt-3 border-t border-gray-100 mt-3 shrink-0">
        <button
          onClick={onAddItem}
          className="inline-flex items-center space-x-1 px-3 py-2 text-sm text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un élément</span>
        </button>
      </div>
    </div>
  );
};

export default Step2BusinessModel;
