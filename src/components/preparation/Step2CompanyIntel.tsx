import React, { useMemo, useState } from 'react'
import { Loader2, Newspaper, History } from 'lucide-react'
import { aiService, TopNewsItem } from '@/lib/aiService'

interface Step2Props {
  data: {
    company_name?: string
    company_summary?: string
    topNewsItems?: TopNewsItem[]
    companyTimeline?: string[] // "- YYYY – label"
  }
  onUpdate: (data: any) => void
}

export default function Step2CompanyIntel({ data, onUpdate }: Step2Props) {
  const [loadingNews, setLoadingNews] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)

  const canGenerate = useMemo(
    () => Boolean(data.company_name || data.company_summary),
    [data.company_name, data.company_summary]
  )

  async function onGenerateNews() {
    setLoadingNews(true)
    try {
      const items = await aiService.getTopNews({ company_name: data.company_name, months: 18, limit: 5 })
      onUpdate({ ...data, topNewsItems: items })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingNews(false)
    }
  }

  async function onGenerateTimeline() {
    setLoadingTimeline(true)
    try {
      const items = await aiService.getCompanyTimeline({
        company_name: data.company_name,
        company_summary: data.company_summary,
      })
      onUpdate({ ...data, companyTimeline: items })
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingTimeline(false)
    }
  }

  return (
    <div className="space-y-6">
      <HeaderCard name={data.company_name} summary={data.company_summary} />

      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          icon={<Newspaper className="w-5 h-5" />}
          title="Top News"
          subtitle="Revue de presse synthétique (12–18 mois) avec sources."
          loading={loadingNews}
          disabled={!canGenerate || loadingNews}
          onClick={onGenerateNews}
        >
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
                      (lire)
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <Hint>Aucune actualité pour l’instant. Cliquez sur Generate.</Hint>
          )}
        </Panel>

        <Panel
          icon={<History className="w-5 h-5" />}
          title="Company Timeline"
          subtitle="Frise chronologique en flèche : fondation, levées, M&A, lancements…"
          loading={loadingTimeline}
          disabled={!canGenerate || loadingTimeline}
          onClick={onGenerateTimeline}
        >
          {Array.isArray(data.companyTimeline) && data.companyTimeline.length > 0 ? (
            <ArrowTimeline items={data.companyTimeline} />
          ) : (
            <Hint>Aucune timeline pour l’instant. Cliquez sur Generate.</Hint>
          )}
        </Panel>
      </div>
    </div>
  )
}

function HeaderCard({ name, summary }: { name?: string; summary?: string }) {
  return (
    <div className="rounded-2xl border p-5 shadow-sm bg-white">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="text-xs uppercase text-gray-500">Entreprise</div>
          <div className="font-medium">{name || '—'}</div>
        </div>
        <div>
          <div className="text-xs uppercase text-gray-500">Résumé</div>
          <div className="text-sm text-gray-600 whitespace-pre-wrap">{summary || '—'}</div>
        </div>
      </div>
    </div>
  )
}

function Panel(props: {
  icon?: React.ReactNode
  title: string
  subtitle?: string
  loading?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  const { icon, title, subtitle, loading, disabled, onClick, children } = props
  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="p-5 border-b">
        <div className="text-lg font-semibold flex items-center gap-2">
          {icon} {title}
        </div>
        {subtitle && <div className="text-sm text-gray-600">{subtitle}</div>}
      </div>
      <div className="p-5 space-y-4">
        <button
          onClick={onClick}
          disabled={disabled}
          className="w-full h-10 rounded-2xl bg-black text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Generate'}
        </button>
        <div>{children}</div>
      </div>
    </div>
  )
}

function Hint({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-gray-500">{children}</div>
}

function ArrowTimeline({ items }: { items: string[] }) {
  // items déjà sous forme "YYYY – évènement"
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
  )
}
