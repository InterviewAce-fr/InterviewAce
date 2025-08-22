import React, { useEffect, useState } from 'react';
import { aiService, TopNewsItem } from '@/lib/aiService';
import { GhostList, SectionCard } from '@/components/common';
import { useDebouncedSave } from '@/components/hooks';
import { smartSet } from '@/utils/textSet';

interface Step3Data {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

interface Step3Props {
  data: Step3Data;
  onUpdate: (data: Step3Data) => void;
  companyName?: string;
}

type Key = keyof Step3Data;

const QUADRANTS: Array<{
  key: Key;
  title: string;
  accent: string;      // couleur de l’accent (border-top)
  dot: string;         // couleur du petit badge
  placeholder: string;
  emoji: string;
}> = [
  { key: 'strengths',     title: 'Strengths',     accent: 'border-t-green-500',  dot: 'bg-green-500',  placeholder: 'Add a strength…',     emoji: '💪' },
  { key: 'weaknesses',    title: 'Weaknesses',    accent: 'border-t-rose-500',   dot: 'bg-rose-500',   placeholder: 'Add a weakness…',     emoji: '🧩' },
  { key: 'opportunities', title: 'Opportunities', accent: 'border-t-blue-500',   dot: 'bg-blue-500',   placeholder: 'Add an opportunity…', emoji: '🚀' },
  { key: 'threats',       title: 'Threats',       accent: 'border-t-amber-500',  dot: 'bg-amber-500',  placeholder: 'Add a threat…',       emoji: '⚠️' },
];

const Step3SWOT: React.FC<Step3Props> = ({ data, onUpdate, companyName }) => {
  // État local normalisé (évite de muter props directement)
  const [swot, setSwot] = useState<Step3Data>({
    strengths: Array.isArray(data?.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data?.weaknesses) ? data.weaknesses : [],
    opportunities: Array.isArray(data?.opportunities) ? data.opportunities : [],
    threats: Array.isArray(data?.threats) ? data.threats : [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Top News state ---
  const [news, setNews] = useState<TopNewsItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);

  // Si data change (navigate back, load), on resynchronise
  useEffect(() => {
    setSwot({
      strengths: Array.isArray(data?.strengths) ? data.strengths : [],
      weaknesses: Array.isArray(data?.weaknesses) ? data.weeknesses ?? data.weaknesses : [], // compat fallback si faute de frappe
      opportunities: Array.isArray(data?.opportunities) ? data.opportunities : [],
      threats: Array.isArray(data?.threats) ? data.threats : [],
    });
  }, [data]);

  // Sauvegarde debouncée (1s) à chaque modif
  useDebouncedSave(swot, (v) => onUpdate(v), 1000);

  const addItem = (k: Key) =>
    setSwot((prev) => ({ ...prev, [k]: [...prev[k], ''] }));

  const updateItem = (k: Key, i: number, v: string) =>
    setSwot((prev) => ({
      ...prev,
      [k]: prev[k].map((it, idx) => (idx === i ? v : it)),
    }));

  const removeItem = (k: Key, i: number) =>
    setSwot((prev) => ({
      ...prev,
      [k]: prev[k].filter((_, idx) => idx !== i),
    }));

  const handleGenerate = async () => {
    try {
      setError(null);
      setLoading(true);
      const ai = await aiService.generateSWOT({ company_name: companyName, existing: swot });
      setSwot((prev) => ({
        strengths:     smartSet(prev.strengths,     ai.strengths),
        weaknesses:    smartSet(prev.weaknesses,    ai.weaknesses),
        opportunities: smartSet(prev.opportunities, ai.opportunities),
        threats:       smartSet(prev.threats,       ai.threats),
      }));
    } catch (e: any) {
      setError(e?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  // --- Fetch Top News ---
  const fetchTopNews = async () => {
    if (!companyName) return;
    try {
      setError(null);
      setLoadingNews(true);
      const n = await aiService.getTopNews({ company_name: companyName, months: 18, limit: 3 });
      setNews(Array.isArray(n) ? n : []);
    } catch (e: any) {
      console.error('[TopNews] UI error', e);
      setError(e?.message || 'Erreur lors de la récupération des news.');
    } finally {
      setLoadingNews(false);
    }
  };

  // Auto-fetch dès que companyName est dispo (et pas déjà chargé)
  useEffect(() => {
    if (companyName && news.length === 0 && !loadingNews) {
      fetchTopNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyName]);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="text-left">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Company Strategy</h2>
          <p className="text-gray-600">
            Analyze the company’s strategic position so you can tailor your impact.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
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

            <button
              onClick={fetchTopNews}
              disabled={loadingNews || !companyName}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black disabled:opacity-50"
              title={companyName ? 'Refresh headlines' : 'Company name required'}
            >
              {loadingNews ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : 'Get Top News'}
            </button>
          </div>
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </div>

      {/* Quadrants SWOT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-fr min-h-0">
        {QUADRANTS.map(({ key, title, accent, dot, placeholder, emoji }) => (
          <SectionCard
            key={key}
            title={
              <span className="inline-flex items-center gap-2">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${dot}`} />
                <span className="text-gray-900">{emoji} {title}</span>
              </span>
            }
            className={`border-t-4 ${accent}`}
            action={
              <button
                onClick={() => addItem(key)}
                className="inline-flex items-center px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
              >
                + Add
              </button>
            }
          >
            <GhostList
              items={swot[key]}
              onUpdate={(i, v) => updateItem(key, i, v)}
              onRemove={(i) => removeItem(key, i)}
              placeholder={placeholder}
            />
          </SectionCard>
        ))}
      </div>

      {/* Top News – style "Une de journal" */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">📰 Top News (last 18 months)</h3>
          {loadingNews && <span className="text-sm text-gray-500">Loading…</span>}
        </div>

        {!loadingNews && news.length === 0 && (
          <div className="text-sm text-gray-500">No major headlines found yet.</div>
        )}

        {news.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((n, idx) => (
              <article
                key={idx}
                className="relative bg-white border rounded-2xl shadow-sm p-6 flex flex-col overflow-hidden"
              >
                {/* Bandeau fin haut pour l'effet presse */}
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

      {/* Tips */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-2">💡 Tips for Company Strategy Analysis</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Check recent company news, filings, and KPIs.</li>
          <li>• Map industry trends & competitors to each SWOT quadrant.</li>
          <li>• Tie your skills to mitigate weaknesses or amplify strengths.</li>
          <li>• Spot quick wins where you can drive immediate impact.</li>
        </ul>
      </div>
    </div>
  );
};

export default Step3SWOT;
