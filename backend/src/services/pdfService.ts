import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

let compiled: Handlebars.TemplateDelegate | null = null;
let helpersRegistered = false;

function registerHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;

  Handlebars.registerHelper("formatDate", (iso?: string) =>
    iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : ""
  );
  Handlebars.registerHelper("join", (arr: any[], sep?: string) =>
    Array.isArray(arr) ? arr.join(sep || ", ") : ""
  );
  Handlebars.registerHelper("percent", (v: any) =>
    typeof v === "number" ? `${Math.round(v)}%` : v ?? ""
  );
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b);
  Handlebars.registerHelper("notEmpty", (v: any) =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

  // ⬇️ Helper manquant dans ta version, requis par le template
  Handlebars.registerHelper("hasContent", (v: any) => {
    if (v == null) return false;
    if (typeof v === "string") return v.trim().length > 0;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    return true;
  });
}

/** Cherche un template dans dist/ puis src/ et accepte 2 noms */
function findTemplateFile(): string {
  const tryPaths = [
    // dist (prod on Heroku)
    path.join(__dirname, "../templates/report.handlebars"),
    path.join(__dirname, "../templates/report-template.html"),
    // src (dev local)
    path.join(__dirname, "../../src/templates/report.handlebars"),
    path.join(__dirname, "../../src/templates/report-template.html"),
    // fallback
    path.join(process.cwd(), "src", "templates", "report.handlebars"),
    path.join(process.cwd(), "src", "templates", "report-template.html"),
  ];
  for (const p of tryPaths) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    `No report template found. Looked in:\n${tryPaths.join("\n")}`
  );
}

function loadTemplate(): Handlebars.TemplateDelegate {
  if (compiled) return compiled;
  registerHelpers();
  const filePath = findTemplateFile();
  const raw = fs.readFileSync(filePath, "utf-8");
  compiled = Handlebars.compile(raw, { noEscape: true });
  return compiled;
}

/** Accepte:
 *  - data.step_X_data déjà à plat, ou
 *  - { preparationData: {...}, showGenerateButton?: boolean }
 */
function normalizeInput(raw: any) {
  const base = raw?.preparationData ? raw.preparationData : raw || {};
  return {
    title:
      base.title ||
      (base.step_1_data?.job_title && base.step_1_data?.company_name
        ? `${base.step_1_data.job_title} at ${base.step_1_data.company_name}`
        : "Interview Preparation"),
    generatedAt: new Date().toISOString(),
    isPremium: Boolean(base.is_premium || base.isPremium),
    showGenerateButton: Boolean(raw?.showGenerateButton),

    step_1_data: base.step_1_data || {},
    step_2_data: base.step_2_data || {},
    step_3_data: base.step_3_data || {},
    step_4_data: base.step_4_data || {},
    step_5_data: base.step_5_data || {},
    step_6_data: base.step_6_data || {},
  };
}

/** Rendu HTML du rapport */
export function renderReport(data: any): string {
  const tpl = loadTemplate();
  const model = normalizeInput(data);
  return tpl(model);
}

/** Génération PDF */
export async function generatePDFReport(
  data: any,
  opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(data);
  return await htmlToPDF(html, opts);
}
