import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

let compiled: Handlebars.TemplateDelegate | null = null;
let helpersRegistered = false;

/* ------------------------- helpers handlebars ------------------------- */
function registerHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;

  Handlebars.registerHelper("formatDate", (iso?: string) =>
    iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : ""
  );
}

/* --------------------------- utils de parsing -------------------------- */
function toArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  const s = String(v);
  // split par retour ligne / point-virgule / pipe / virgule
  return s
    .split(/\r?\n|;|\||,/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function tryJson<T = any>(v: any): T | null {
  if (!v || typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

/* ---------------------- mapping prep -> template ---------------------- */
function normalizeForTemplate(incoming: any) {
  // Cases attendus :
  // incoming = { ... } OU incoming = { preparationData: {...}, showGenerateButton? }
  const prep = incoming?.preparationData ? incoming.preparationData : incoming;

  const s1 = prep?.step_1_data || {};
  const s2 = prep?.step_2_data || {};
  const s3 = prep?.step_3_data || {};
  const s4 = prep?.step_4_data || {};
  const s5 = prep?.step_5_data || {};
  const s6 = prep?.step_6_data || {};

  // Certaines étapes peuvent arriver en string JSON : on gère
  const S2 = typeof s2 === "string" ? (tryJson(s2) || {}) : s2;
  const S3 = typeof s3 === "string" ? (tryJson(s3) || {}) : s3;
  const S4 = typeof s4 === "string" ? (tryJson(s4) || {}) : s4;
  const S5 = typeof s5 === "string" ? (tryJson(s5) || {}) : s5;
  const S6 = typeof s6 === "string" ? (tryJson(s6) || {}) : s6;

  // -------- Header
  const role = {
    title:
      s1?.job_title ||
      prep?.title ||
      (prep?.job_title ?? "") ||
      "",
  };

  const company = {
    name: s1?.company_name || s1?.company || "",
    website: s1?.company_website || s1?.website || "",
    // Business model (depuis step_2)
    businessModel:
      S2?.business_model ||
      S2?.value_propositions ||
      S2?.summary ||
      "",
    revenueStreams: toArray(S2?.revenue_streams),
    pricing: toArray(S2?.pricing),
    keyCustomers: toArray(S2?.customer_segments || S2?.segments),

    // Top news (on accepte plusieurs formes: topNews, top_news, news)
    topNews:
      (Array.isArray(S3?.topNews) && S3.topNews) ||
      (Array.isArray(S3?.top_news) && S3.top_news) ||
      (Array.isArray(S2?.topNews) && S2.topNews) ||
      (Array.isArray(S2?.top_news) && S2.top_news) ||
      (Array.isArray(S3?.news) && S3.news) ||
      [],
  };

  const candidate = {
    name:
      S4?.candidate_name ||
      prep?.candidate_name ||
      (prep?.user && prep?.user?.name) ||
      "—",
  };

  // -------- Strategy (ex-SWOT) depuis step_3
  const strategy = {
    strengths: toArray(S3?.strengths),
    weaknesses: toArray(S3?.weaknesses),
    opportunities: toArray(S3?.opportunities),
    threats: toArray(S3?.threats),
  };

  // -------- Profile Match (step_4 + éventuel résultat de match)
  const profileMatchRaw =
    S4?.profileMatch ||
    S4?.matchProfile ||
    S4?.match_profile ||
    null;

  const profileMatch = profileMatchRaw
    ? {
        matchScore: profileMatchRaw.matchScore ?? profileMatchRaw.score ?? undefined,
        summary: profileMatchRaw.summary ?? undefined,
        items:
          profileMatchRaw.items ||
          profileMatchRaw.requirements ||
          [],
      }
    : {
        matchScore: undefined,
        summary: S4?.personal_mission || undefined,
        items: (S4?.key_skills || S4?.achievements)
          ? toArray(S4.key_skills || [])
              .concat(toArray(S4.achievements || []))
              .map((txt: string) => ({
                requirement: "Skill/Achievement",
                evidence: txt,
                score: undefined,
              }))
          : [],
      };

  // -------- WHY (step_5)
  const why = {
    whyCompany: toArray(S5?.why_them || S5?.why_company),
    whyRole: toArray(S5?.why_role), // si tu enregistres un champ "why_role"
    whyYou: toArray(S5?.why_you).concat(toArray(S5?.why_now || S5?.elevator_pitch)),
  };

  // -------- Interview Q&A (step_6)
  // step_6_data: { questions: [{question, answer?, tips?}], questions_to_ask: [string] }
  const qForCandidate = Array.isArray(S6?.questions)
    ? S6.questions.map((q: any) => ({
        question: q?.question || q?.q || "",
        answer: q?.answer || "",
        note: q?.tips || q?.note || "",
      }))
    : [];

  const qForCompany = toArray(S6?.questions_to_ask).map((q) => ({
    question: q,
    note: "",
  }));

  const interview = {
    questionsForCandidate: qForCandidate,
    questionsForCompany: qForCompany,
  };

  return {
    generatedAt: new Date().toISOString(),
    // champs attendus par le template
    candidate,
    company,
    role,
    strategy,
    profileMatch,
    why,
    interview,
  };
}

/* ----------------------------- template load ---------------------------- */
function templatePath(): string {
  const candidates = [
    path.join(__dirname, "../templates/report.handlebars"),
    path.join(__dirname, "../../src/templates/report.handlebars"),
    path.join(process.cwd(), "src", "templates", "report.handlebars"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Template introuvable: src/templates/report.handlebars");
}

function loadTemplate(): Handlebars.TemplateDelegate {
  if (compiled) return compiled;
  registerHelpers();
  const raw = fs.readFileSync(templatePath(), "utf-8");
  compiled = Handlebars.compile(raw, { noEscape: true });
  return compiled;
}

/* ----------------------------- rendu & pdf ------------------------------ */
export function renderReport(data: any): string {
  const tpl = loadTemplate();
  const model = normalizeForTemplate(data);
  const html = tpl(model);
  try { console.log(`[pdfService] html length = ${html?.length ?? 0}`); } catch {}
  return html;
}

export async function generatePDFReport(
  data: any,
  _opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(data);
  return htmlToPDF(html, _opts);
}
