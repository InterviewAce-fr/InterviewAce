import React from 'react';

export interface TimelineItem {
  date: string;
  title: string;
  description: string;
  category?: string;
  impact?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  emptyLabel?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, emptyLabel = 'No history found yet.' }) => {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="w-full text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* vertical line */}
      <div className="absolute top-0 left-4 bottom-0 w-px bg-gray-200" />
      <ul className="space-y-6">
        {items.map((it, idx) => (
          <li key={idx} className="relative pl-10">
            {/* node */}
            <div className="absolute left-3 top-1.5 h-3 w-3 rounded-full bg-indigo-600 shadow ring-2 ring-white" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-500">{it.date || '—'}</span>
                  {it.category && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 border border-gray-200">
                      {it.category}
                    </span>
                  )}
                </div>
                <h4 className="mt-1 text-sm font-semibold text-gray-900">{it.title}</h4>
                <p className="mt-1 text-sm text-gray-600">{it.description}</p>
                {it.impact && (
                  <p className="mt-1 text-xs text-gray-500 italic">Impact: {it.impact}</p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};
