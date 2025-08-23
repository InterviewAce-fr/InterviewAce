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
  // Données de démo minimales pour que le template affiche du contenu
  return {
    title: "Senior Product Manager at Acme Corp",
    step_1_data: {
      job_title: "Senior Product Manager",
      company_name: "Acme Corp",
      location: "Paris",
      key_requirements: ["SaaS B2B", "Analytics", "Leadership"],
      key_responsibilities: ["Roadmap", "Discovery", "Delivery"],
    },
    step_2_data: {
      value_propositions: "Gain, pain relievers, features clés",
      customer_segments: "Mid-market B2B",
      revenue_streams: "Abonnement mensuel",
      key_activities: "R&D, Go-to-market",
    },
    step_3_data: {
      strengths: ["Brand", "Marge brute 80%"],
      weaknesses: ["Pricing add-ons"],
      opportunities: ["Automatisation IA"],
      threats: ["Nouveaux entrants low-cost"],
    },
    step_4_data: {
      personal_mission: "Construire des produits utiles et scalables",
      key_skills: ["SQL", "Amplitude", "UX", "Leadership"],
      achievements: ["+25% NPS", "–12% churn"],
    },
    step_5_data: {
      why_you: "Exp. SaaS, mindset data, delivery robuste",
      why_them: "Culture produit, croissance",
      why_now: "Phase de scale, Série B",
      elevator_pitch: "PM expérimenté orienté impact & data.",
    },
    step_6_data: {
      questions: [
        { question: "Parlez d’un échec marquant", answer: "Contexte, métriques, apprentissages" },
        { question: "Comment priorisez-vous ?", tips: "RICE, contraintes, quick wins" },
      ],
      questions_to_ask: [
        "Comment mesurez-vous le succès produit ?",
        "Quelles sont les priorités 6–12 mois ?",
      ],
    },
    showGenerateButton: true,
  };
}

/* ----------------------------- HTML PREVIEW ------------------------------ */

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
    let data: any;

    if (req.method === "GET" && typeof req.query.data === "string") {
      data = decodeBase64Query(req.query.data);
    } else {
      data = req.body && Object.keys(req.body).length ? req.body : sampleData();
    }

    const pdf = await generatePDFReport(data);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="report.pdf"');
    return res.status(200).send(pdf);
  } catch (err: any) {
    // on renvoie le détail pour faciliter le debug côté front (console)
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
