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
  // Parse "YYYY – évènement"
  const milestones = (items || []).map((raw, idx) => {
    const s = String(raw || '').trim();
    const m = s.match(/^(\d{4}(?:[-/]\d{2})?)\s*[–-]\s*(.+)$/);
    const date = m ? m[1] : s.slice(0, 7);
    const label = m ? m[2] : s;
    return { id: `${idx}-${date}`, date, label };
  });

  if (milestones.length === 0) return null;

  // Nombre max d'éléments par ligne (responsive-friendly pour A4/écran)
  const maxPerRow =
    milestones.length <= 5 ? milestones.length : milestones.length <= 10 ? 5 : 6;

  const chunk = <T,>(arr: T[], size: number): T[][] => {
    const out: T[][] = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
  };

  const rows = chunk(milestones, maxPerRow);

  return (
    <div className="space-y-8">
      {rows.map((row, rIdx) => {
        const isReverse = rIdx % 2 === 1; // snake: 1ère ligne L→R, 2ème R→L, etc.
        const view = isReverse ? [...row].reverse() : row;
        return (
          <div key={`row-${rIdx}`} className="relative">
            {/* Piste dégradée */}
            <div
              className={`pointer-events-none absolute left-0 right-0 top-8 h-2 rounded-full ${
                isReverse
                  ? 'bg-gradient-to-l from-indigo-500 via-sky-500 to-fuchsia-500'
                  : 'bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500'
              }`}
            />
            {/* Pointe de flèche en fin de ligne */}
            <div
              className={`pointer-events-none absolute top-[26px] w-0 h-0 border-t-[12px] border-b-[12px] border-l-[16px] border-t-transparent border-b-transparent ${
                isReverse
                  ? 'border-l-indigo-500 -scale-x-100 left-0'
                  : 'border-l-fuchsia-500 right-0'
              }`}
            />

            {/* Grille de cartes – s'adapte à la largeur sans overflow */}
            <div
              className="grid gap-8"
              style={{
                gridTemplateColumns: `repeat(${view.length}, minmax(180px, 1fr))`,
              }}
            >
              {view.map((m) => (
                <div key={m.id} className="relative pt-12">
                  {/* Repère (dot) aligné sur la piste */}
                  <div className="absolute left-1/2 top-8 -translate-x-1/2">
                    <div className="h-3 w-3 rounded-full bg-white ring-4 ring-white shadow">
                      <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    </div>
                  </div>
                  {/* Carte milestone */}
                  <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                      {m.date}
                    </div>
                    <div className="mt-1 text-sm text-gray-900 leading-6">
                      {m.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
