import fetch from 'node-fetch'

export type CompanyContext = {
  companyName?: string
  companySummary?: string
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''

async function callOpenAI(system: string, user: string) {
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature: 0.2,
    }),
  })
  if (!resp.ok) {
    const t = await resp.text()
    throw new Error(`OpenAI error: ${resp.status} ${t}`)
  }
  const data = await resp.json()
  return data?.choices?.[0]?.message?.content || ''
}

export async function generateCompanyTimeline(ctx: CompanyContext) {
  const system =
    'Historien corporate. Sors une frise en liste Markdown de 6–10 bullets. Chaque bullet commence par YYYY (ou YYYY-MM), tiret long (–), puis un libellé court. Priorité: fondation, funding, lancements, M&A, pivots, IPO, partenariats. Français.'
  const user =
    `Entreprise: ${ctx.companyName || 'Inconnue'}\n` +
    `Résumé: ${ctx.companySummary || 'N/A'}\n` +
    `Tâche: Frise chronologique (format "- YYYY – évènement").`
  return callOpenAI(system, user)
}

// Utilitaire basique (fallback) si tu veux l’utiliser côté backend
export function extractCompanyFromJob(raw?: string): { companyName?: string; companySummary?: string } {
  if (!raw) return {}
  const nameMatch =
    raw.match(/(?:company|société|entreprise)\s*[:\-]\s*(.+)/i) ||
    raw.match(/(?:nom de l'?entreprise)\s*[:\-]\s*(.+)/i)
  const companyName = nameMatch?.[1]?.split(/\||\n/)[0]?.trim()

  const summaryMatch = raw.match(
    /(?:about\s+(?:us|the company)|à\s+propos(?:\s+de\s+l'?entreprise)?)\s*[:\-]?\s*([\s\S]{80,500})/i
  )
  const companySummary = summaryMatch?.[1]?.split(/\n{2,}/)[0]?.trim()

  return { companyName: companyName || undefined, companySummary: companySummary || undefined }
}
