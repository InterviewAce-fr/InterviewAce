import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

/* ----------------------- Helpers Handlebars (une fois) ---------------------- */
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

/* ------------------------------ Template path ------------------------------ */
function templatePath(): string {
  const distPath = path.join(__dirname, "../templates/report.handlebars");
  if (fs.existsSync(distPath)) return distPath;
  const devPath = path.join(__dirname, "../../src/templates/report.handlebars");
  if (fs.existsSync(devPath)) return devPath;
  return path.join(process.cwd(), "src", "templates", "report.handlebars");
}

function loadTemplate(): Handlebars.TemplateDelegate {
  if (compiled) return compiled;
  registerHelpers();
  const filePath = templatePath();
  const raw = fs.readFileSync(filePath, "utf-8");
  compiled = Handlebars.compile(raw /* pas de noEscape ici pour la sécurité */);
  return compiled;
}

/* ---------------------------- Normalisation utils -------------------------- */
function toArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((x) => (typeof x === "string" ? x.trim() : x))
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/\r?\n|•|- |\u2022|;|,/) // coupe raisonnablement
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function mapTopNews(raw: any): Array<{ title: string; url?: string; source?: string; date?: string; summary?: string }> {
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((n: any) => ({
    title: n?.title || n?.headline || "",
    url: n?.url || n?.link || "",
    source: n?.source || n?.publisher || "",
    date: n?.date || n?.publishedAt || "",
    summary: n?.summary || ""
  })).filter(n => n.title);
}

/* -------------------------- PREP → modèle du template ---------------------- */
export function prepareModel(prep: any, opts?: { showGenerateButton?: boolean; isPremium?: boolean }) {
  const s1 = prep?.step_1_data || {};
  const s2 = prep?.step_2_data || {};
  const s3 = prep?.step_3_data || {};
  const s4 = prep?.step_4_data || {};
  const s5 = prep?.step_5_data || {};
  const s6 = prep?.step_6_data || {};

  const titleFromS1 = [s1?.job_title, s1?.company_name].filter(Boolean).join(" at ");

  const model: any = {
    generatedAt: new Date().toISOString(),
    title: prep?.title || titleFromS1 || "Interview Preparation",
    candidate: {
      name: s1?.candidate_name || prep?.candidate_name || "",
      email: s1?.candidate_email || prep?.candidate_email || "",
    },
    role: {
      title: s1?.job_title || prep?.job_title || "",
      location: s1?.location || "",
      salary: s1?.salary_range || "",
    },
    company: {
      name: s1?.company_name || prep?.company_name || "",
      website: s1?.company_website || s1?.website || "",
      description: s1?.company_description || "",
      // ---- Business model (Step 2)
      businessModel:
        s2?.value_propositions ||
        s2?.business_model ||
        s2?.summary ||
        "",
      revenueStreams: toArray(s2?.revenue_streams || s2?.revenueStreams || s2?.revenues),
      pricing: toArray(s2?.pricing || s2?.pricingNotes || s2?.pricing_notes),
      keyCustomers: toArray(s2?.customer_segments || s2?.customers || s2?.segments),
      // ---- Top news (depuis step_3_data ou équivalent)
      topNews: mapTopNews(s3?.topNews || s3?.top_news || prep?.topNews),
    },
    // ---- Strategy (ex-SWOT) — Step 3
    strategy: {
      strengths: toArray(s3?.strengths),
      weaknesses: toArray(s3?.weaknesses),
      opportunities: toArray(s3?.opportunities),
      threats: toArray(s3?.threats),
    },
    // ---- Profile & Experience matching — Step 4
    profileMatch: (function () {
      const matchScore = s4?.matchScore ?? s4?.match_score ?? s4?.score ?? null;
      const itemsSrc = Array.isArray(s4?.items) ? s4.items : [];
      let items = itemsSrc.map((it: any) => ({
        requirement: it?.requirement || it?.label || it?.name || "",
        evidence: it?.evidence || it?.note || it?.experience || "",
        score: typeof it?.score === "number" ? it.score : (typeof it?.match === "number" ? it.match : null),
      })).filter((x: any) => x.requirement || x.evidence || x.score !== null);

      // fallback: si pas d'items, fabriquer depuis step_1.key_requirements + éventuelles expériences indexées
      if (!items.length) {
        const reqs = toArray(s1?.key_requirements);
        const exps = toArray(s4?.experiences || s4?.key_experiences);
        items = reqs.map((r: string, i: number) => ({
          requirement: r,
          evidence: exps[i] || "",
          score: null,
        }));
      }

      return {
        matchScore: typeof matchScore === "number" ? matchScore : null,
        summary: s4?.summary || "",
        items,
      };
    })(),
    // ---- The Why — Step 5
    why: {
      whyCompany: toArray(s5?.why_company || s5?.whyCompany),
      whyRole: toArray(s5?.why_role || s5?.whyRole),
      // Concatène "why you" et "why now" si séparés
      whyYou: [...toArray(s5?.why_you || s5?.whyYou), ...toArray(s5?.why_now || s5?.whyNow)],
    },
    // ---- Q&A — Step 6
    interview: {
      questionsForCandidate: (function () {
        const q = Array.isArray(s6?.questions) ? s6?.questions : (Array.isArray(s6?.company_questions) ? s6.company_questions : []);
        return q.map((x: any) => ({
          question: x?.question || "",
          answer: x?.answer || "",
          note: x?.tips || x?.note || "",
        })).filter((x: any) => x.question);
      })(),
      questionsForCompany: (function () {
        const q = Array.isArray(s6?.questions_to_ask) ? s6?.questions_to_ask : (Array.isArray(s6?.candidate_questions) ? s6.candidate_questions : []);
        return q.map((x: any) => (typeof x === "string" ? { question: x } : { question: x?.question || "" }))
                .filter((x: any) => x.question);
      })(),
    },
    // options d'affichage
    showGenerateButton: !!opts?.showGenerateButton,
    isPremium: !!opts?.isPremium,
    FRONTEND_URL: process.env.FRONTEND_URL || "",
  };

  return model;
}

/* ------------------------------ Rendu & PDF -------------------------------- */
export function renderReport(data: any): string {
  const tpl = loadTemplate();
  return tpl(data);
}

export async function generatePDFReport(data: any, _opts?: { landscape?: boolean }): Promise<Buffer> {
  const html = renderReport(data);
  const pdf = await htmlToPDF(html, _opts);
  return pdf;
}
