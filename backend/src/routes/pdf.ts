import { Router } from "express";
import { renderReport } from "../services/pdfService";
import { renderPdf } from "../services/pdfEngine";

const router = Router();

router.get("/health", (_req, res) => res.json({ ok: true }));

router.post("/report", async (req, res, next) => {
  try {
    const data = req.body ?? {};
    const html = renderReport(data);

    const wantPdf =
      String(req.query.format ?? data?.options?.format ?? "").toLowerCase() ===
      "pdf";
    const wantDownload = !!(req.query.download ?? data?.options?.download);

    if (!wantPdf) {
      return res.type("html").send(html);
    }

    const pdf = await renderPdf(html);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      wantDownload ? 'attachment; filename="report.pdf"' : "inline"
    );
    return res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export default router;
