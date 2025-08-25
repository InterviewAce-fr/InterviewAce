// src/components/preparation/Step2CompanyIntel.tsx
import React, { useState } from 'react';
import { aiService, TopNewsItem } from '@/lib/aiService';
import { Loader2 } from 'lucide-react';

interface Step2CompanyIntelProps {
  data: {
    company_name?: string;
    company_summary?: string;
    companyTimeline?: string[];   // ["YYYY – évènement", ...]
    topNewsItems?: TopNewsItem[]; // même format que ta route /ai/top-news
  };
  onUpdate: (data: any) => void;
  jobData?: any
  companyName?: string
}

export default function Step2CompanyIntel({ data, onUpdate, jobData, companyName }: Step2CompanyIntelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const derivedName = companyName ?? jobData?.company_name ?? data.company_name;
  const derivedSummary = jobData?.company_summary ?? data.company_summary;
  const canGenerate = !!(derivedName || derivedSummary);

  async function handleGenerate() {
    if (!canGenerate || isGenerating) return;
    setIsGenerating(true);
    try {
      // 1) Timeline
     const timeline = await aiService.getCompanyTimeline({
       company_name: derivedName,
       company_summary: derivedSummary,
        limit: 8,
      });

      onUpdate({ ...data, companyTimeline: timeline });

      // 2) Top News
     const news = await aiService.getTopNews({
       company_name: derivedName,
        months: 18,
        limit: 5,
      });

      onUpdate({ ...data, companyTimeline: timeline, topNewsItems: news });
    } catch (e) {
      console.error('[CompanyIntel] generate error', e);
      // pas de UI nouvelle : on reste minimal
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header + bouton unique Generate */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Company Intelligence</h2>
            <p className="text-sm text-gray-600">
              {derivedName || 'Company'} — {derivedSummary ? 'context available' : 'no summary'}
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {isGenerating ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Timeline (haut) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Timeline</h3>
        {Array.isArray(data.companyTimeline) && data.companyTimeline.length > 0 ? (
          <ArrowTimeline items={data.companyTimeline} />
        ) : (
          <p className="text-sm text-gray-600">No timeline yet. Click “Generate”.</p>
        )}
      </div>

      {/* Top News (bas) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top News</h3>
        {Array.isArray(data.topNewsItems) && data.topNewsItems.length > 0 ? (
          <ul className="list-disc pl-5 space-y-2">
            {data.topNewsItems.map((n, i) => (
              <li key={i} className="text-sm">
                <span className="font-medium">{n.title}</span>
                {n.source ? <span className="text-gray-500"> — {n.source}</span> : null}
                <br />
                <span className="text-gray-700">{n.summary}</span>{' '}
                {n.url ? (
                  <a className="text-blue-600 underline" href={n.url} target="_blank" rel="noreferrer">
                    (read)
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">No news yet. Click “Generate”.</p>
        )}
      </div>
    </div>
  );
}

function ArrowTimeline({ items }: { items: string[] }) {
  // items attendus : ["YYYY – évènement", ...]
  return (
    <div className="relative overflow-x-auto pb-4">
      <div className="relative flex items-center gap-8 pr-10">
        {items.map((text, i) => (
          <div key={i} className="relative min-w-[220px]">
            <div className="h-2 bg-gray-200 rounded-full" />
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-xl shadow">
              <span className="text-xs font-medium">{text}</span>
            </div>
          </div>
        ))}
        <div className="w-0 h-0 border-t-8 border-b-8 border-l-8 border-t-transparent border-b-transparent border-l-gray-300" />
      </div>
    </div>
  );
}
