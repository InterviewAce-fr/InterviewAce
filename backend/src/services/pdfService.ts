// backend/src/services/pdfService.ts
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

  // ✅ Manquait et cassait le rendu
  Handlebars.registerHelper("hasContent", (v: any) => {
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "object") return Object.keys(v).length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return !!v;
  });
}

function templatePath(): string {
  // Prod (dist/)
  const distHb = path.join(__dirname, "../templates/report.handlebars");
  if (fs.existsSync(distHb)) return distHb;
  const distHtml = path.join(__dirname, "../templates/report-template.html");
  if (fs.existsSync(distHtml)) return distHtml;

  // Dev (src/)
  const srcHb = path.join(__dirname, "../../src/templates/report.handlebars");
  if (fs.existsSync(srcHb)) return srcHb;
  const srcHtml = path.join(__dirname, "../../src/templates/report-template.html");
  if (fs.existsSync(srcHtml)) return srcHtml;

  // Dernier recours
  return path.join(process.cwd(), "src", "templates", "report.handlebars");
}

function loadTemplate(): Handlebars.TemplateDelegate {
  if (compiled) return compiled;
  registerHelpers();
  const filePath = templatePath();
  const raw = fs.readFileSync(filePath, "utf-8");
  compiled = Handlebars.compile(raw, { noEscape: true });
  return compiled;
}

function normalizeModel(input: any): any {
  if (input && typeof input === "object" && input.preparationData) {
    const { preparationData, ...rest } = input;
    const merged = { ...rest, ...preparationData };

    if (rest.showGenerateButton !== undefined) {
      (merged as any).showGenerateButton = rest.showGenerateButton;
    }
    if (rest.isPremium !== undefined) {
      (merged as any).isPremium = rest.isPremium;
    }
    if (!merged.title) {
      const jt = merged?.step_1_data?.job_title?.trim?.();
      const cn = merged?.step_1_data?.company_name?.trim?.();
      (merged as any).title = jt && cn ? `${jt} at ${cn}` : "Interview Preparation";
    }
    return merged;
  }

  if (input && !input.title) {
    const jt = input?.step_1_data?.job_title?.trim?.();
    const cn = input?.step_1_data?.company_name?.trim?.();
    input.title = jt && cn ? `${jt} at ${cn}` : "Interview Preparation";
  }
  return input;
}

/** Rendu HTML du rapport */
export function renderReport(data: any): string {
  const tpl = loadTemplate();

  const FRONTEND_URL =
    process.env.FRONTEND_URL ||
    process.env.WEBSITE_URL ||
    "https://startling-salamander-f45eec.netlify.app";

  const model = normalizeModel({
    generatedAt: new Date().toISOString(),
    FRONTEND_URL,
    ...data,
  });

  return tpl(model);
}

/** Génération PDF */
export async function generatePDFReport(
  data: any,
  opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(data);
  const pdf = await htmlToPDF(html, opts);
  return pdf;
}
