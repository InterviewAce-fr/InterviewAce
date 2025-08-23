import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
// ⚠️ on suppose que ton pdfEngine expose une fonction htmlToPDF(html, opts?)
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
}

function templatePath(): string {
  // En prod (dist)
  const distPath = path.join(__dirname, "../templates/report.handlebars");
  if (fs.existsSync(distPath)) return distPath;
  // En dev (src)
  const devPath = path.join(__dirname, "../../src/templates/report.handlebars");
  if (fs.existsSync(devPath)) return devPath;

  // Dernier recours : même dossier (utile si empaqueté autrement)
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

/** Rendu HTML du rapport */
export function renderReport(data: any): string {
  const tpl = loadTemplate();
  const model = {
    generatedAt: new Date().toISOString(),
    ...data,
  };
  return tpl(model);
}

/** Génération PDF (signature tolère un 2e arg optionnel pour compat) */
export async function generatePDFReport(
  data: any,
  _opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(data);
  const pdf = await htmlToPDF(html, _opts);
  return pdf;
}
