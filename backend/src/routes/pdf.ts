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
    generatedAt: new Date().toISOString(),
    title: "Senior Product Manager at Acme",
    step_1_data: { job_title: "Senior PM", company_name: "Acme" },
    step_2_data: { value_propositions: "SaaS B2B", customer_segments: "Mid/Enterprise", revenue_streams: "Pro/Ent", key_activities: "Roadmap" },
    step_3_data: {
      strengths: ["Brand", "Gross margin 80%"],
      weaknesses: ["Pricing add-ons confus"],
      opportunities: ["IA automation"],
      threats: ["Low-cost entrants"],
    },
    step_4_data: { key_skills: ["SaaS PM", "Data"], achievements: ["+30% NRR"], personal_mission: "User impact" },
    step_5_data: { why_you: "Exp B2B SaaS", why_them: "Culture produit", why_now: "Phase scale", elevator_pitch: "30s pitch" },
    step_6_data: {
      questions: [
        { question: "Parlez d’un échec marquant", tips: "STAR" },
        { question: "Comment priorisez-vous ?", answer: "RICE + contraintes", tips: "Impact" },
      ],
      questions_to_ask: ["Comment mesurez-vous le succès produit ?"],
    },
    showGenerateButton: true,
  };
}

function denestIncoming(incoming: any) {
  if (incoming?.preparationData) {
    return {
      ...incoming.preparationData,
      showGenerateButton: !!incoming.showGenerateButton,
    };
  }
  return incoming;
}

/* ----------------------------- HTML PREVIEW ------------------------------ */
async function handleGetHtml(req: Request, res: Response) {
  try {
    let incoming: any;

    if (req.query.sample === "1") {
      incoming = sampleData();
    } else if (typeof req.query.data === "string") {
      incoming = decodeBase64Query(req.query.data);
    }

    if (!incoming) {
      incoming = Object.keys(req.body || {}).length ? req.body : sampleData();
    }

    const data = denestIncoming(incoming);
    const html = renderReport(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.status(200).send(html);
  } catch (err: any) {
    console.error("PDF html error:", err);
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
    let incoming: any;

    if (req.method === "GET" && typeof req.query.data === "string") {
      incoming = decodeBase64Query(req.query.data);
    } else {
      incoming = req.body && Object.keys(req.body).length ? req.body : sampleData();
    }

    const data = denestIncoming(incoming);
    const pdf = await generatePDFReport(data);
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

/* ------------------------------- DEBUG ----------------------------------- */
router.post("/debug", (req: Request, res: Response) => {
  const incoming = Object.keys(req.body || {}).length ? req.body : {};
  const data = denestIncoming(incoming);
  const flags = {
    has_step1: !!data?.step_1_data && Object.keys(data.step_1_data).length > 0,
    has_step2: !!data?.step_2_data && Object.keys(data.step_2_data).length > 0,
    has_step3: !!data?.step_3_data && Object.keys(data.step_3_data).length > 0,
    has_step4: !!data?.step_4_data && Object.keys(data.step_4_data).length > 0,
    has_step5: !!data?.step_5_data && Object.keys(data.step_5_data).length > 0,
    has_step6: !!data?.step_6_data && Object.keys(data.step_6_data).length > 0,
  };
  res.json({ keys: Object.keys(data || {}), title: data?.title, flags, samplePreview: !!req.query.sample });
});

/* -------------------------------- PING ----------------------------------- */
router.get("/", (_req, res) => {
  res.status(200).json({ status: "pdf service ok" });
});

export default router;
