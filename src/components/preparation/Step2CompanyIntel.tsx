// src/components/preparation/Step2CompanyIntel.tsx
import React, { useState } from 'react';
import { aiService, TopNewsItem } from '@/lib/aiService';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
 const containerRef = React.useRef<HTMLDivElement>(null);

 const milestones = (items || []).map((raw, idx) => {
   const s = String(raw || '').trim();
   // Parse "YYYY – label" or "YYYY-MM – label"
   const m = s.match(/^(\d{4}(?:[-/]\d{2})?)\s*[–-]\s*(.+)$/);
   const date = m ? m[1] : s.slice(0, 7);
   const label = m ? m[2] : s;
   return { id: `${idx}-${date}`, date, label };
 });

 const scroll = (dir: number) => {
   const el = containerRef.current;
   if (!el) return;
   const amt = Math.min(600, el.clientWidth * 0.9);
   el.scrollBy({ left: amt * dir, behavior: 'smooth' });
 };

 return (
   <div className="relative">
     {/* Controls */}
     <div className="mb-3 flex justify-end gap-2">
       <button
         type="button"
         onClick={() => scroll(-1)}
         className="inline-flex items-center rounded-lg border px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
         aria-label="Scroll left"
       >
         <ChevronLeft className="h-4 w-4" />
       </button>
       <button
         type="button"
         onClick={() => scroll(1)}
         className="inline-flex items-center rounded-lg border px-2 py-1 text-sm text-gray-700 hover:bg-gray-50"
         aria-label="Scroll right"
       >
         <ChevronRight className="h-4 w-4" />
       </button>
     </div>
     
     {/* Track + Arrow head */}
     <div
       ref={containerRef}
       className="relative overflow-x-auto snap-x snap-mandatory pb-8"
     >
       <div className="relative flex items-start gap-10 min-w-max pr-14">
         {/* gradient track */}
         <div className="pointer-events-none absolute left-0 right-8 top-7 h-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500" />
         {/* arrow head */}
         <div className="pointer-events-none absolute right-0 top-[18px] w-0 h-0 border-t-[12px] border-b-[12px] border-l-[16px] border-t-transparent border-b-transparent border-l-fuchsia-500" />
         {milestones.map((m, i) => (
           <div key={m.id} className="snap-start min-w-[280px]">
             <div className="relative pt-10">
               {/* dot on the track */}
               <div className="absolute left-1/2 top-[18px] -translate-x-1/2">
                 <div className="h-3 w-3 rounded-full bg-white ring-4 ring-white shadow">
                   <div className="h-3 w-3 rounded-full bg-indigo-600" />
                 </div>
               </div>
               {/* card */}
               <div className="rounded-2xl border bg-white p-4 shadow-sm hover:shadow-md transition-shadow">
                 <div className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600">
                   {m.date}
                 </div>
                 <div className="mt-1 text-sm text-gray-900 leading-6">
                   {m.label}
                 </div>
               </div>
             </div>
           </div>
         ))}
       </div>
     </div>
   </div>
 );
}
