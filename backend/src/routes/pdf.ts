import { Router, Request, Response } from "express";
import { renderReport, generatePDFReport } from "../services/pdfService";

const router = Router();

function decodeBase64Query(q?: string) {
  if (!q) return undefined;
  try {
    const b64 = q.replace(/ /g, "+");
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json);
  } catch (e) {
    return undefined;
  }
}

function sampleData() {
  return {
    generatedAt: new Date().toISOString(),
    candidate: { name: "Jane Doe", email: "jane@doe.io" },
    role: { title: "Senior Product Manager" },
    company: { name: "Acme Corp", website: "https://acme.example" },

    strategy: {
      businessModel: {
        summary: "SaaS B2B (abonnement mensuel)",
        revenueStreams: ["Pro / Enterprise", "Add-ons"],
        pricingNotes: "ARPU ~120 €, churn 2.1%",
      },
      marketNews: [
        { title: "Acme lève 20 M€ (Série B)", source: "TechCrunch", date: "2025-08-01" },
        { title: "Partenariat Acme x BigCo", source: "Les Échos", date: "2025-08-17" },
      ],
      positioning: {
        strengths: ["Brand", "Marge brute +80%"],
        weaknesses: ["Pricing confus sur add-ons"],
        opportunities: ["Automatisation IA", "Expansion US"],
        threats: ["Nouveaux entrants low-cost"],
      },
    },

    profileMatch: {
      matchScore: 86,
      items: [
        { label: "Exp PM B2B SaaS", score: 90, note: "5+ ans" },
        { label: "Data", score: 80, note: "SQL/Amplitude" },
        { label: "Leadership", score: 88, note: "Scope transverse" },
      ],
    },

    why: {
      company: ["Croissance forte", "Culture produit", "Equipe senior"],
      role: ["Impact transverse", "Roadmap 12–18 mois ambitieuse"],
      you: ["Exp B2B", "Data mindset", "Go-to-market"],
    },

    interview: {
      companyToCandidate: [
        {
          question: "Parlez d’un échec marquant et des apprentissages.",
          answer: "Expliquer le contexte, les métriques, ce qui a été changé.",
        },
        {
          question: "Comment priorisez-vous sur backlog contraint ?",
          answer: "RICE, contraintes ressources, quick wins vs impact long terme.",
        },
      ],
      candidateToCompany: [
        { question: "Comment mesurez-vous le succès produit ?", answer: "" },
        { question: "Quelles sont les priorités 6–12 mois ?", answer: "" },
      ],
    },
  };
}

/* ----------------------------- HTML PREVIEW ------------------------------ */

/**
 * GET /api/pdf/html
 * GET /api/pdf/preview (alias)
 * - ?sample=1 => données de démo
 * - ?data=<base64 JSON> => données passées par le front en base64
 */
async function handleGetHtml(req: Request, res: Response) {
  try {
    let data: any;

    if (req.query.sample === "1") {
      data = sampleData();
    } else if (typeof req.query.data === "string") {
      data = decodeBase64Query(req.query.data);
    }

    if (!data) {
      // si rien reçu, on essaie le body (Netlify peut proxy en GET avec body vide)
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

/** POST /api/pdf/html — rend du HTML depuis le body JSON */
router.post("/html", async (req: Request, res: Response) => {
  try {
    const data = req.body && Object.keys(req.body).length ? req.body : sampleData();
    const html = renderReport(data);
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

/**
 * Génère un PDF à partir:
 * - du body JSON (POST)
 * - ou de ?data=<base64> (GET)
 * Aliases: /generate, /pdf, / (legacy)
 */
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
    return res.status(500).json({
      error: "Failed to generate PDF",
      details: String(err?.message || err),
    });
  }
}

// POST endpoints
router.post("/generate", handleGeneratePdf);
router.post("/pdf", handleGeneratePdf);
router.post("/", handleGeneratePdf); // compat ancien front

// GET endpoint (optionnel) pour ?data=...
router.get("/generate", handleGeneratePdf);

/* -------------------------------- PING ----------------------------------- */
router.get("/", (_req, res) => {
  res.status(200).json({ status: "pdf service ok" });
});

export default router;
