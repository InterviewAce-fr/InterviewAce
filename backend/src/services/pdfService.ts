import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

let compiled: Handlebars.TemplateDelegate | null = null;
let helpersRegistered = false;

function hasContent(v: any): boolean {
  if (!v) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  if (typeof v === "object") return Object.keys(v).length > 0;
  return !!v;
}

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
  Handlebars.registerHelper("notEmpty", (v: any) => hasContent(v));
  Handlebars.registerHelper("hasContent", (v: any) => hasContent(v));
}

function findExisting(paths: string[]): string | null {
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch {}
  }
  return null;
}

function templatePath(): string {
  // On cherche D'ABORD report-template.html, puis report.handlebars (dist puis src)
  const candidates = [
    path.join(__dirname, "../templates/report-template.html"),
    path.join(__dirname, "../templates/report.handlebars"),
    path.join(__dirname, "../../src/templates/report-template.html"),
    path.join(__dirname, "../../src/templates/report.handlebars"),
    path.join(process.cwd(), "src", "templates", "report-template.html"),
    path.join(process.cwd(), "src", "templates", "report.handlebars"),
  ];
  const found = findExisting(candidates);
  if (!found) {
    throw new Error(
      "Template introuvable: place `report-template.html` ou `report.handlebars` dans src/templates"
    );
  }
  return found;
}

function loadTemplate(): Handlebars.TemplateDelegate {
  if (compiled) return compiled;
  registerHelpers();
  const filePath = templatePath();
  const raw = fs.readFileSync(filePath, "utf-8");
  compiled = Handlebars.compile(raw, { noEscape: true });
  return compiled;
}

export function renderReport(data: any): string {
  const tpl = loadTemplate();
  const model = {
    generatedAt: new Date().toISOString(),
    FRONTEND_URL: process.env.FRONTEND_URL || "",
    isPremium: !!data?.isPremium,
    ...data,
  };
  const html = tpl(model);
  // petit log utile pour debug Heroku
  try {
    console.log(`[pdfService] html length = ${html?.length ?? 0}`);
  } catch {}
  return html;
}

export async function generatePDFReport(
  data: any,
  _opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(data);
  const pdf = await htmlToPDF(html, _opts);
  return pdf;
}
