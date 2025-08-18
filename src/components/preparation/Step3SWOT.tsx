import React, { useState } from 'react';
import { aiService } from '@/lib/aiService';

interface Step3Data {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface Step3Props {
  data: Step3Data;
  onUpdate: (data: Step3Data) => void;
}

const Step3SWOT: React.FC<Step3Props> = ({ data, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedData: Step3Data = {
    strengths: Array.isArray(data?.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data?.weaknesses) ? data.weaknesses : [],
    opportunities: Array.isArray(data?.opportunities) ? data.opportunities : [],
    threats: Array.isArray(data?.threats) ? data.threats : []
  };

  const normKey = (s: string) => s.toLowerCase().trim();
  const mergeNoDup = (base: string[], add: string[]) => {
    const seen = new Set(base.map(normKey));
    const append = add.filter(x => {
      const k = normKey(x);
      if (k && !seen.has(k)) { seen.add(k); return true; }
      return false;
    });
    return [...base, ...append];
  };

  const smartSet = (current: string[], incoming: string[]) => {
    if (!current || current.length === 0) return incoming;
    return mergeNoDup(current, incoming);
  };

  const handleGenerate = async () => {
    try {
      setError(null);
      setLoading(true);
      const existing = normalizedData; // on envoie le déjà-saisi pour meilleure complétion
      const swot = await aiService.generateSWOT({ existing });
      onUpdate({
        strengths: smartSet(normalizedData.strengths, swot.strengths),
        weaknesses: smartSet(normalizedData.weaknesses, swot.weaknesses),
        opportunities: smartSet(normalizedData.opportunities, swot.opportunities),
        threats: smartSet(normalizedData.threats, swot.threats)
      });
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  const handleItemChange = (category: keyof Step3Data, index: number, value: string) => {
    const newData = { ...normalizedData };
    newData[category][index] = value;
    onUpdate(newData);
  };

  const addItem = (category: keyof Step3Data) => {
    const newData = { ...normalizedData };
    newData[category] = [...newData[category], ''];
    onUpdate(newData);
  };

  const removeItem = (category: keyof Step3Data, index: number) => {
    const newData = { ...normalizedData };
    newData[category] = newData[category].filter((_, i) => i !== index);
    onUpdate(newData);
  };

  const renderSection = (
    title: string,
    category: keyof Step3Data,
    bgColor: string,
    borderColor: string
  ) => (
    <div className={`${bgColor} ${borderColor} border-2 rounded-lg p-6`}>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <div className="space-y-3">
        {normalizedData[category].map((item, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={item}
              onChange={(e) => handleItemChange(category, index, e.target.value)}
              placeholder={`Enter ${title.toLowerCase().slice(0, -1)}...`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => removeItem(category, index)}
              className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        <button
          onClick={() => addItem(category)}
          className="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
        >
          + Add {title.slice(0, -1)}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-start justify-between mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Company Strategy</h2>
          <p className="text-gray-600">Analyze the company's strategic position to understand how you can contribute to their success.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            )}
            Generate
          </button>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderSection('Strengths', 'strengths', 'bg-green-50', 'border-green-200')}
        {renderSection('Weaknesses', 'weaknesses', 'bg-red-50', 'border-red-200')}
        {renderSection('Opportunities', 'opportunities', 'bg-blue-50', 'border-blue-200')}
        {renderSection('Threats', 'threats', 'bg-yellow-50', 'border-yellow-200')}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">💡 Tips for Company Strategy Analysis:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Research recent company news, financial reports, and market position</li>
          <li>• Consider industry trends and competitive landscape</li>
          <li>• Think about how your skills can address their weaknesses or leverage their strengths</li>
          <li>• Identify opportunities where you can make an immediate impact</li>
        </ul>
      </div>
    </div>
  );
};

export default Step3SWOT;