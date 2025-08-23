import { Router, Request, Response } from "express";
import { renderReport, generatePDFReport } from "../services/pdfService";

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

function sampleData() {
  return {
    title: "Senior PM at Acme Corp",
    generatedAt: new Date().toISOString(),
    isPremium: false,
    showGenerateButton: true,
    step_1_data: {
      job_title: "Senior Product Manager",
      company_name: "Acme Corp",
      location: "Paris",
      key_requirements: ["5+ ans", "B2B SaaS", "Data"],
    },
    step_2_data: {
      value_propositions: "SaaS B2B",
      customer_segments: "Mid-market",
      revenue_streams: "Sub + add-ons",
      key_activities: "Roadmap, GTM",
    },
    step_3_data: {
      strengths: ["Brand", "Gross margin +80%"],
      weaknesses: ["Pricing confus"],
      opportunities: ["Automatisation IA"],
      threats: ["Low-cost entrants"],
    },
    step_4_data: {
      personal_mission: "Construire des produits utiles",
      key_skills: ["PM", "Analytics", "Leadership"],
      achievements: ["+20% MRR", "NPS +12"],
    },
    step_5_data: {
      why_you: "Expérience B2B SaaS + data",
      why_them: "Croissance et culture produit",
      why_now: "Nouveau cycle produit",
      elevator_pitch: "Je délivre de la valeur rapidement et durablement.",
    },
    step_6_data: {
      questions: [
        { question: "Parlez d’un échec marquant.", answer: "Contexte → actions → résultats." },
      ],
      questions_to_ask: ["Comment mesurez-vous le succès produit ?"],
    },
  };
}

/** ---------- HTML PREVIEW ---------- */
async function handleGetHtml(req: Request, res: Response) {
  try {
    let data: any;
    if (req.query.sample === "1") {
      data = sampleData();
    } else if (typeof req.query.data === "string") {
      data = decodeBase64Query(req.query.data);
    }
    if (!data) {
      data = Object.keys(req.body || {}).length ? req.body : sampleData();
    }
    const html = renderReport(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err: any) {
    console.error("HTML render error:", err);
    res.status(500).json({ error: "Failed to render HTML", details: String(err?.message || err) });
  }
}

router.get("/html", handleGetHtml);
router.get("/preview", handleGetHtml);
router.post("/html", handleGetHtml);

/** ---------- PDF GENERATION ---------- */
async function handleGeneratePdf(req: Request, res: Response) {
  try {
    let data: any;
    if (req.method === "GET" && typeof req.query.data === "string") {
      data = decodeBase64Query(req.query.data);
    } else {
      data = Object.keys(req.body || {}).length ? req.body : sampleData();
    }
    const pdf = await generatePDFReport(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="report.pdf"');
    res.status(200).send(pdf);
  } catch (err: any) {
    console.error("PDF generate error:", err);
    res.status(500).json({ error: "Failed to generate PDF", details: String(err?.message || err) });
  }
}

router.post("/generate", handleGeneratePdf);
router.post("/pdf", handleGeneratePdf);
router.post("/", handleGeneratePdf);
router.get("/generate", handleGeneratePdf);

/** ---------- PING ---------- */
router.get("/", (_req, res) => res.status(200).json({ status: "pdf service ok" }));

export default router;
