import React, { useState } from 'react';
import { Newspaper, History, Loader2, ExternalLink } from 'lucide-react';
import { aiService, TopNewsItem } from '@/lib/aiService';
import { SectionCard } from '@/components/common/SectionCard';
import { Timeline, TimelineItem } from '@/components/common/Timeline';
import { toast } from '@/components/ui/Toast';

interface Step2TopNewsHistoryProps {
  data: {
    topNews?: TopNewsItem[];
    timeline?: TimelineItem[];
  };
  onUpdate: (data: { topNews?: TopNewsItem[]; timeline?: TimelineItem[] }) => void;
  jobData?: any;
  companyName?: string;
}

const Step2TopNewsHistory: React.FC<Step2TopNewsHistoryProps> = ({ data, onUpdate, jobData, companyName }) => {
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const effectiveCompany = companyName || jobData?.company_name || '';
  const companySummary = jobData?.company_summary || '';

  const fetchNews = async () => {
    if (!effectiveCompany) {
      toast.error('Please fill in the company name in Job Analysis first.');
      return;
    }
    setLoadingNews(true);
    try {
      const news = await aiService.getTopNews({
        company_name: effectiveCompany,
        months: 18,
        limit: 3,
        company_summary: companySummary,
      });
      onUpdate({ ...data, topNews: news });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to fetch news');
    } finally {
      setLoadingNews(false);
    }
  };

  const fetchHistory = async () => {
    if (!effectiveCompany) {
      toast.error('Please fill in the company name in Job Analysis first.');
      return;
    }
    setLoadingHistory(true);
    try {
      const hist = await aiService.getCompanyHistory({
        company_name: effectiveCompany,
        limit: 8,
        company_summary: companySummary,
      });
      onUpdate({ ...data, timeline: hist.timeline || [] });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to fetch company history');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top News */}
      <SectionCard
        title={
          <div className="flex items-center">
            <Newspaper className="h-5 w-5 mr-2 text-indigo-600" />
            <span>Top News</span>
          </div>
        }
        right={
          <button
            onClick={fetchNews}
            disabled={loadingNews}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingNews ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Fetching…</>) : 'Fetch latest'}
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(data.topNews || []).map((n, idx) => (
            <div key={idx} className="border rounded-xl p-4 bg-white shadow-sm">
              <div className="text-xs text-gray-500">{n.source || '—'} · {n.date || ''}</div>
              <h4 className="mt-1 text-sm font-semibold text-gray-900">{n.title}</h4>
              <p className="mt-1 text-sm text-gray-700">{n.summary}</p>
              <a href={n.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-700">
                Open <ExternalLink className="h-3.5 w-3.5 ml-1" />
              </a>
            </div>
          ))}
          {(!data.topNews || data.topNews.length === 0) && (
            <div className="col-span-1 md:col-span-3 text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6">
              No major headlines fetched yet.
            </div>
          )}
        </div>
      </SectionCard>

      {/* Company History */}
      <SectionCard
        title={
          <div className="flex items-center">
            <History className="h-5 w-5 mr-2 text-indigo-600" />
            <span>Company History</span>
          </div>
        }
        right={
          <button
            onClick={fetchHistory}
            disabled={loadingHistory}
            className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingHistory ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>) : 'Generate timeline'}
          </button>
        }
      >
        <Timeline items={data.timeline || []} />
      </SectionCard>
    </div>
  );
};

export default Step2TopNewsHistory;
