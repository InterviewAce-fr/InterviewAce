import { Router, Request, Response } from "express";
import { prepareModel, renderReport, generatePDFReport } from "../services/pdfService";

const router = Router();

function decodeBase64Query(q?: string) {
  if (!q) return undefined;
  try {
    const b64 = q.replace(/ /g, "+");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return undefined;
  }
}

function extractPrep(req: Request) {
  // le front envoie { preparationData, showGenerateButton, isPremium }
  const body = (req.body && Object.keys(req.body).length ? req.body : {}) as any;
  const q = typeof req.query.data === "string" ? decodeBase64Query(req.query.data) : null;

  const preparationData =
    body.preparationData || (q && q.preparationData) || q || body || {};

  const showGenerateButton = !!(body.showGenerateButton ?? (q && q.showGenerateButton));
  const isPremium = !!(body.isPremium ?? (q && q.isPremium));

  return { preparationData, showGenerateButton, isPremium };
}

// --- petit helper: récupère les top news si absentes -----------------------
async function maybeFetchTopNews(req: Request, companyName?: string) {
  if (!companyName) return [];
  try {
    const base = `${req.protocol}://${req.get("host")}`;
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 3500);

    const resp = await fetch(`${base}/api/ai/top-news`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: companyName, months: 18, limit: 3 }),
      signal: ac.signal,
    }).catch((e) => {
      // en cas de timeout/abort -> pas bloquant
      return null as any;
    });
    clearTimeout(t);

    if (!resp || !resp.ok) return [];
    const json = await resp.json();

    // normalisation minimale pour le template
    const arr = Array.isArray(json) ? json : Array.isArray(json?.items) ? json.items : [];
    return arr
      .map((n: any) => ({
        title: n?.title || n?.headline || "",
        url: n?.url || n?.link || "",
        source: n?.source || n?.publisher || "",
        date: n?.date || n?.publishedAt || "",
        summary: n?.summary || n?.description || "",
        category: n?.category || "",
      }))
      .filter((n: any) => n.title);
  } catch {
    return [];
  }
}

/* ----------------------------- HTML PREVIEW ------------------------------ */

async function handleGetHtml(req: Request, res: Response) {
  try {
    const { preparationData, showGenerateButton, isPremium } = extractPrep(req);
    const model = prepareModel(preparationData, { showGenerateButton, isPremium });

    // fallback: si pas de news en base, on tente un fetch à la volée
    if ((!model?.company?.topNews || model.company.topNews.length === 0) && model?.company?.name) {
      const news = await maybeFetchTopNews(req, model.company.name);
      if (news.length > 0) {
        model.company.topNews = news;
      }
    }

    const html = renderReport(model);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to render HTML",
      details: String(err?.message || err),
    });
  }
}

router.get("/html", handleGetHtml);
router.get("/preview", handleGetHtml);
router.post("/html", handleGetHtml);

/* ----------------------------- PDF GENERATION ---------------------------- */

async function handleGeneratePdf(req: Request, res: Response) {
  try {
    const { preparationData, isPremium } = extractPrep(req);
    const model = prepareModel(preparationData, { isPremium, showGenerateButton: false });

    if ((!model?.company?.topNews || model.company.topNews.length === 0) && model?.company?.name) {
      const news = await maybeFetchTopNews(req, model.company.name);
      if (news.length > 0) {
        model.company.topNews = news;
      }
    }

    const pdf = await generatePDFReport(model);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="report.pdf"');
    return res.status(200).send(pdf);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to generate PDF",
      details: String(err?.message || err),
    });
  }
}

router.post("/generate", handleGeneratePdf);
router.post("/pdf", handleGeneratePdf);
router.post("/", handleGeneratePdf);
router.get("/generate", handleGeneratePdf);

/* -------------------------------- PING ----------------------------------- */
router.get("/", (_req, res) => {
  res.status(200).json({ status: "pdf service ok" });
});

export default router;
