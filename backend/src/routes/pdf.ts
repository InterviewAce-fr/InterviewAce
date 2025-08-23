// backend/src/routes/pdf.ts
import { Router, Request, Response } from "express";
import { renderReport, generatePDFReport } from "../services/pdfService";

const router = Router();

/** Données d’exemple si rien n’est fourni (utile pour le preview) */
function sampleData() {
  return {
    generatedAt: new Date().toISOString(),
    candidate: { name: "Jane Doe" },
    role: { title: "Senior Product Manager" },
    company: { name: "Acme Corp" },
    strategy: {
      businessModel: {
        summary: "SaaS B2B, abonnement mensuel",
        revenueStreams: ["Plans Pro/Enterprise", "Add-ons"],
        pricingNotes: "ARPU > 120 €/mois, churn 2.1%",
      },
      marketNews: [
        { title: "Acme lève 20 M€ (Série B)", source: "TechCrunch", date: "2025-08-01" },
      ],
      positioning: { strengths: ["Brand"], weaknesses: ["Pricing"], opportunities: ["AI"], threats: ["Competition"] },
    },
    profileMatch: {
      matchScore: 86,
      items: [
        { label: "PM experience", score: 90, note: "5+ ans, B2B SaaS" },
        { label: "Data skills", score: 80, note: "SQL/Amplitude" },
      ],
    },
    why: {
      company: ["Croissance", "Culture produit"],
      role: ["Impact transverse", "Ownership"],
      you: ["Exp B2B", "Ops & data"],
    },
    interview: {
      companyToCandidate: [
        { question: "Parlez d’un échec et apprentissages", answer: "..." },
      ],
      candidateToCompany: [
        { question: "Comment mesurez-vous le succès produit ?", answer: "" },
      ],
    },
  };
}

/**
 * GET /api/pdf/html
 * - ?sample=1 pour un rendu de démo
 * - ?data=<base64 JSON> pour rendre avec des données fournies par le front
 */
router.get("/html", async (req: Request, res: Response) => {
  try {
    let data: any;

    if (req.query.sample === "1") {
      data = sampleData();
    } else if (typeof req.query.data === "string") {
      const b64 = (req.query.data as string).replace(/ /g, "+");
      const json = Buffer.from(b64, "base64").toString("utf8");
      data = JSON.parse(json);
    } else {
      data = sampleData();
    }

    const html = renderReport(data);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to render HTML", details: String(err?.message || err) });
  }
});

/** POST /api/pdf/html — rend du HTML depuis le body JSON */
router.post("/html", async (req: Request, res: Response) => {
  try {
    const html = renderReport(req.body || {});
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.status(200).send(html);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to render HTML", details: String(err?.message || err) });
  }
});

/** POST /api/pdf — retourne le PDF binaire */
router.post("/", async (req: Request, res: Response) => {
  try {
    const pdf = await generatePDFReport(req.body || {});
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'inline; filename="report.pdf"');
    res.status(200).send(pdf);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate PDF", details: String(err?.message || err) });
  }
});

export default router;
