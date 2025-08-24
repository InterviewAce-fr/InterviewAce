import { Router } from 'express'
import { generateCompanyTimeline } from '../services/aiService.server'

const router = Router()

// POST /api/ai/company-timeline
router.post('/company-timeline', async (req, res) => {
  try {
    const { company_name, company_summary } = req.body || {}

    const content = await generateCompanyTimeline({
      companyName: company_name,
      companySummary: company_summary,
    })

    // On renvoie une liste de bullets "- YYYY – évènement"
    const items = (content || '')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- '))
      .map((l) => l.replace(/^-+\s*/, ''))

    res.json({ items })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'timeline error' })
  }
})

export default router
