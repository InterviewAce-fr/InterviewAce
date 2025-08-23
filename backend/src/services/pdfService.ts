import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { ReportData } from "../types/report";
import { renderPdf } from "./pdfEngine";

// ⚠️ Tu as créé "report.handlebars", donc on pointe dessus.
// Si tu renommes le fichier en report.hbs, change ce nom ici aussi.
const TEMPLATE_PATH = path.join(__dirname, "..", "templates", "report.handlebars");

// Compile le template une seule fois
const templateSrc = fs.readFileSync(TEMPLATE_PATH, "utf8");
const template = Handlebars.compile(templateSrc, { noEscape: true });

/**
 * Rend le rapport en HTML (utilisé par la route /report quand on veut juste du HTML).
 */
export function renderReport(raw: Partial<ReportData> & any): string {
  const data: ReportData = normalize(raw);
  return template(data);
}

/**
 * Fonction conservant la signature attendue par src/worker.ts.
 * Génère directement un PDF (Buffer) à partir des données du rapport.
 * -> C’est celle que worker.ts importe: `generatePDFReport(...)`
 */
export async function generatePDFReport(raw: Partial<ReportData> & any): Promise<Buffer> {
  const html = renderReport(raw);
  const pdf = await renderPdf(html);
  return pdf;
}

/** Normalisation / compat + valeurs par défaut */
function normalize(raw: any): ReportData {
  // Compat: ancien "swot" -> "strategy"
  const strategy = raw?.strategy ?? raw?.swot ?? {};
  const generatedAt = raw?.generatedAt ?? dayjs().format("DD MMM YYYY HH:mm");

  // Calcul d’un score moyen si non fourni
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
