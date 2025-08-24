import { Router, Request, Response } from "express";
import { renderReport, generatePDFReport, prepareModel } from "../services/pdfService";

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

function samplePreparation() {
  return {
    title: "Senior PM at Acme",
    step_1_data: {
      job_title: "Senior Product Manager",
      company_name: "Acme Corp",
      location: "Paris",
      salary_range: "€80k–€100k",
      company_description: "Acme fournit une plateforme B2B SaaS…",
      key_requirements: ["5+ ans PM", "Data literacy", "Leadership transverse"],
    },
    step_2_data: {
      value_propositions: "SaaS B2B pour la supply chain",
      revenue_streams: ["Pro", "Enterprise", "Add-ons AI"],
      pricing: ["ARPU ~120 €", "Churn 2.1%"],
      customer_segments: ["Retail", "Manufacturing"],
    },
    step_3_data: {
      strengths: ["Brand", "Marge brute +80%"],
      weaknesses: ["Pricing confus sur add-ons"],
      opportunities: ["Automatisation IA", "Expansion US"],
      threats: ["Nouveaux entrants low-cost"],
      topNews: [
        { title: "Acme lève 20 M€", source: "TechCrunch", date: "2025-08-01", url: "https://example.com" },
      ],
    },
    step_4_data: {
      matchScore: 86,
      items: [
        { requirement: "Exp PM B2B SaaS", evidence: "5+ ans, scope plateforme", score: 90 },
        { requirement: "Data", evidence: "SQL/Amplitude", score: 80 },
        { requirement: "Leadership", evidence: "Squads transverses", score: 88 },
      ],
    },
    step_5_data: {
      why_company: ["Croissance forte", "Culture produit", "Equipe senior"],
      why_role: ["Impact transverse", "Roadmap ambitieuse 12–18 mois"],
      why_now: ["Cycle perso aligné", "Marché porteur"],
      why_you: ["Exp B2B", "Data mindset"],
    },
    step_6_data: {
      questions: [
        { question: "Parlez d’un échec marquant", answer: "Contexte → métriques → apprentissages", tips: "STAR + chiffres" },
      ],
      questions_to_ask: [
        "Comment mesurez-vous le succès produit ?",
        "Quelles sont les priorités 6–12 mois ?",
      ],
    },
  };
}

/* ----------------------------- HTML PREVIEW ------------------------------ */

async function handleGetHtml(req: Request, res: Response) {
  try {
    let body: any = {};
    let opts: { showGenerateButton?: boolean; isPremium?: boolean } = {};

    if (req.query.sample === "1") {
      body = samplePreparation();
      opts.showGenerateButton = true;
    } else if (typeof req.query.data === "string") {
      body = decodeBase64Query(req.query.data) || {};
    } else if (req.body && Object.keys(req.body).length) {
      body = req.body;
    }

    const prep = body.preparationData || body; // tolère body direct
    opts.showGenerateButton = !!(body.showGenerateButton ?? opts.showGenerateButton);
    opts.isPremium = !!body.isPremium;

    const model = prepareModel(prep, opts);
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

router.post("/html", async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const prep = body.preparationData || body;
    const model = prepareModel(prep, {
      showGenerateButton: !!body.showGenerateButton,
      isPremium: !!body.isPremium,
    });
    const html = renderReport(model);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    return res.status(500).json({
      error: "Failed to render HTML",
      details: String(err?.message || err),
    });
  }
});

/* ----------------------------- PDF GENERATION ---------------------------- */

async function handleGeneratePdf(req: Request, res: Response) {
  try {
    let prep: any;

    if (req.method === "GET" && typeof req.query.data === "string") {
      prep = decodeBase64Query(req.query.data) || {};
    } else {
      const body = req.body || {};
      prep = body.preparationData || body;
    }

    const model = prepareModel(prep);
    const pdf = await generatePDFReport(model);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="report.pdf"');
    return res.status(200).send(pdf);
  } catch (err: any) {
    console.error("PDF generate error:", err);
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
