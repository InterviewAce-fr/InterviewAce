import React, { useMemo } from 'react';
import { TopNewsItem } from '@/lib/aiService';

export default function Step7GenerateReport({ data, onUpdate }: { data: any; onUpdate: (d: any) => void }) {
  const intro = useMemo(() => {
    const parts: string[] = [];

    if (Array.isArray(data?.topNewsItems) && data.topNewsItems.length > 0) {
      parts.push('## Top News\n');
      parts.push(
        data.topNewsItems
          .map((n: TopNewsItem) => {
            const src = n.source ? ` — ${n.source}` : '';
            const link = n.url ? ` ([lire](${n.url}))` : '';
            return `- **${n.title}**${src}\n  ${n.summary}${link}`;
          })
          .join('\n')
      );
    }

    if (Array.isArray(data?.companyTimeline) && data.companyTimeline.length > 0) {
      parts.push('## Company Timeline\n');
      parts.push(data.companyTimeline.map((x: string) => `- ${x}`).join('\n'));
    }

    return parts.join('\n\n');
  }, [data?.topNewsItems, data?.companyTimeline]);

  const body = useMemo(() => {
    return `# Rapport Candidat\n\n${intro}\n\n---\n\n` + '... reste du rapport ...';
  }, [intro]);

  return (
    <div className="space-y-6">
      <article className="prose max-w-none" dangerouslySetInnerHTML={{ __html: mdToHtml(body) }} />
    </div>
  );
}

function mdToHtml(md?: string) {
  if (!md) return '';
  let html = md
    .replace(/^##\s(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s(.+)$/gm, '<h1>$1</h1>')
    .replace(/^\-\s(.+)$/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul class="list-disc pl-6">${m}</ul>`);
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
  html = html.replace(/\n/g, '<br/>');
  return html;
}
