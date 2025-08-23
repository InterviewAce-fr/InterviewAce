import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { ReportData } from "../types/report";
import { renderPdf } from "./pdfEngine";

// Ton template : "report.handlebars"
const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "report.handlebars");

// Compile une fois
const templateSrc = fs.readFileSync(TEMPLATE_PATH, "utf8");
const template = Handlebars.compile(templateSrc, { noEscape: true });

/** Génère le HTML du rapport (utilisé par la route HTML si besoin) */
export function renderReport(raw: Partial<ReportData> & any): string {
  const data: ReportData = normalize(raw);
  return template(data);
}

/**
 * BACKWARD-COMPAT: accepte un 2ᵉ argument optionnel.
 * Certains appels (ex: worker.ts) passent (data, options|jobId|whatever).
 * On le relaie au moteur PDF si pertinent; sinon, il est ignoré.
 */
export async function generatePDFReport(
  raw: Partial<ReportData> & any,
  options?: any
): Promise<Buffer> {
  const html = renderReport(raw);
  // Si ton pdfEngine ne prend qu'un seul argument, ce cast évite l'erreur TS.
  const pdf: Buffer = await (renderPdf as any)(html, options);
  return pdf;
}

/** Normalisation + valeurs par défaut */
function normalize(raw: any): ReportData {
  const strategy = raw?.strategy ?? raw?.swot ?? {};
  const generatedAt = raw?.generatedAt ?? dayjs().format("DD MMM YYYY HH:mm");

  let matchScore = raw?.profileMatch?.matchScore;
  if (
    matchScore == null &&
    Array.isArray(raw?.profileMatch?.items) &&
    raw.profileMatch.items.length
  ) {
    const scored = raw.profileMatch.items
      .map((i: any) => (typeof i.score === "number" ? i.score : undefined))
      .filter((n: number | undefined) => typeof n === "number") as number[];
    if (scored.length) {
      matchScore = Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
    }
  }

  return {
    generatedAt,
    candidate: { name: "", ...raw?.candidate },
    role: { title: "", ...raw?.role },
    company: { name: "", ...raw?.company },
    strategy,
    profileMatch: raw?.profileMatch
      ? {
          ...raw.profileMatch,
          matchScore,
        }
      : undefined,
    why: raw?.why,
    interview: raw?.interview,
  } as ReportData;
}
