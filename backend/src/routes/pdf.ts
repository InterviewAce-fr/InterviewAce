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

/* ----------------------------- HTML PREVIEW ------------------------------ */

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

async function handleGetHtml(req: Request, res: Response) {
  try {
    const { preparationData, showGenerateButton, isPremium } = extractPrep(req);
    const model = prepareModel(preparationData, { showGenerateButton, isPremium });
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
