import { Router } from 'express'
import { generateCompanyTimeline } from '../services/aiService.server'

const router = Router()

// POST /api/ai/company-timeline
router.post('/company-timeline', async (req, res) => {
  try {
    const { company_name, company_summary, limit } = req.body || {}
    const items = await generateCompanyTimeline({ company_name, company_summary, limit })
    res.json({ items })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'timeline error' })
  }
})

export default router
