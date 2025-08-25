// src/components/preparation/Step2CompanyIntel.tsx
import React, { useState } from 'react';
import { aiService, TopNewsItem, CompetitorItem } from '@/lib/aiService';
import { Loader2 } from 'lucide-react';

interface Step2CompanyIntelProps {
  data: {
    company_name?: string;
    company_summary?: string;
    companyTimeline?: string[];   // ["YYYY – évènement", ...]
    topNewsItems?: TopNewsItem[]; // même format que ta route /ai/top-news
    competitors?: CompetitorItem[];
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

      // 3) Competitors
      const competitors = await aiService.getCompetitors({
        company_name: derivedName,
        company_summary: derivedSummary,
        limit: 6,
      });

      onUpdate({
        ...data,
        companyTimeline: timeline,
        topNewsItems: news,
        competitors,
      });
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

      {/* Competitive Landscape (milieu) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive Landscape</h3>
        {Array.isArray(data.competitors) && data.competitors.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.competitors.map((c, i) => (
              <article key={i} className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{c.name || '—'}</h4>
                    <div className="text-xs text-gray-500">{c.country || '—'}{c.segment ? ` • ${c.segment}` : ''}</div>
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full border bg-gray-50 text-gray-700">
                    {c.relative_size}
                  </span>
                </div>
                {Array.isArray(c.differentiators) && c.differentiators.length > 0 && (
                  <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                    {c.differentiators.slice(0,3).map((d, k) => <li key={k}>{d}</li>)}
                  </ul>
                )}
                {c.url && (
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex text-sm text-blue-700 hover:underline"
                  >
                    Visit site →
                  </a>
                )}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-600">No competitors yet. Click “Generate”.</p>
        )}
      </div>      

      {/* Top News (bas) */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">📰 Top News (last 18 months)</h3>
          {isGenerating && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        {(!isGenerating && (!Array.isArray(data.topNewsItems) || data.topNewsItems.length === 0)) && (
          <div className="text-sm text-gray-500">No major headlines found yet.</div>
        )}

        {Array.isArray(data.topNewsItems) && data.topNewsItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {data.topNewsItems.map((n, idx) => (
              <article
                key={idx}
                className="relative bg-white border rounded-2xl shadow-sm p-6 flex flex-col overflow-hidden"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-gray-900 via-blue-600 to-gray-900" />
                <span className="text-xs text-gray-400 mt-2">
                  {n.date ? new Date(n.date).toLocaleDateString() : '—'}
                </span>
                <h4 className="mt-2 text-xl font-extrabold leading-snug">{n.title}</h4>

                {n.category && (
                  <span className="mt-1 inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 w-fit">
                    {n.category}
                  </span>
                )}

                <p className="mt-3 text-sm text-gray-700 flex-1">{n.summary}</p>

                {n.url && (
                  <a
                    href={n.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-700 hover:underline"
                  >
                    Read article →
                  </a>
                )}

                {n.source && <span className="mt-2 text-xs text-gray-400">Source: {n.source}</span>}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ArrowTimeline({ items }: { items: string[] }) {
  // Parse "YYYY – évènement" + tri descendant (récents -> anciens)
  const milestones = (items || [])
    .map((raw, idx) => {
      const s = String(raw || '').trim();
      const m = s.match(/^(\d{4}(?:[-/]\d{2})?)\s*[–-]\s*(.+)$/);
      const date = m ? m[1] : s.slice(0, 7);
      const label = m ? m[2] : s;
      const toTs = (d: string) => {
        const [yy, mm] = d.split(/[-/]/).map((n) => Number(n));
        const y = Number.isFinite(yy) ? yy : 0;
        const mo = Number.isFinite(mm) ? mm - 1 : 0;
        return new Date(y, mo, 1).getTime();
      };
      return { id: `${idx}-${date}`, date, label, ts: toTs(date) };
    })
    .sort((a, b) => b.ts - a.ts); // plus récent en premier (haut-gauche)

  if (milestones.length === 0) return null;

  // Nombre max d'éléments par ligne (sans scroll, adapté A4/écran)
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
      {rows.map((row, rIdx) => (
        <div key={`row-${rIdx}`} className="relative">
          {/* Piste dégradée (L→R, pas de triangles) */}
          <div className="pointer-events-none absolute left-0 right-0 top-8 h-2 rounded-full bg-gradient-to-r from-indigo-500 via-sky-500 to-fuchsia-500" />

          {/* Grille L→R (ordre de lecture naturel) */}
          <div
            className="grid gap-8"
            style={{
              gridTemplateColumns: `repeat(${row.length}, minmax(180px, 1fr))`,
            }}
          >
            {row.map((m) => (
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
      ))}
    </div>
  );
}