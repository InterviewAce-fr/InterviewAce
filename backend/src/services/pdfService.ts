import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

let compiled: Handlebars.TemplateDelegate | null = null;
let helpersRegistered = false;

/* ------------------------- Handlebars helpers ------------------------- */
function registerHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;

  Handlebars.registerHelper("formatDate", (iso?: string) =>
    iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : ""
  );

  Handlebars.registerHelper("notEmpty", (v: any) =>
    Array.isArray(v) ? v.length > 0 : !!v
  );

  Handlebars.registerHelper("or", (a: any, b: any) => (!!a) || (!!b));
  Handlebars.registerHelper("and", (a: any, b: any) => (!!a) && (!!b));
}

/* ------------------------------ utils -------------------------------- */
function toArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter(Boolean).map(String);
  const s = String(v);
  return s
    .split(/\r?\n|;|\||,/g)
    .map((x) => x.trim())
    .filter(Boolean);
}

function tryJson<T = any>(v: any): T | null {
  if (!v || typeof v !== "string") return null;
  try { return JSON.parse(v); } catch { return null; }
}

function normalizeNewsItem(item: any) {
  if (!item) return null;
  if (typeof item === "string") return { title: item };
  return {
    title: item.title || item.t || "",
    source: item.source || item.s || "",
    url: item.url || item.link || "",
    date: item.date || item.published_at || item.publishedAt || "",
    summary: item.summary || item.snippet || "",
  };
}

/* -------- mapping preparationData (steps) -> template attendu ---------- */
function normalizeForTemplate(incoming: any) {
  // on accepte soit { preparationData: {...} } soit un objet directement
  const prep = incoming?.preparationData ? incoming.preparationData : incoming;

  const s1 = prep?.step_1_data || {};
  const s2 = typeof prep?.step_2_data === "string" ? (tryJson(prep.step_2_data) || {}) : (prep?.step_2_data || {});
  const s3 = typeof prep?.step_3_data === "string" ? (tryJson(prep.step_3_data) || {}) : (prep?.step_3_data || {});
  const s4 = typeof prep?.step_4_data === "string" ? (tryJson(prep.step_4_data) || {}) : (prep?.step_4_data || {});
  const s5 = typeof prep?.step_5_data === "string" ? (tryJson(prep.step_5_data) || {}) : (prep?.step_5_data || {});
  const s6 = typeof prep?.step_6_data === "string" ? (tryJson(prep.step_6_data) || {}) : (prep?.step_6_data || {});

  /* -------- header (candidate / role / company) -------- */
  const role = {
    title: s1?.job_title || prep?.title || s1?.title || "",
  };

  const topNewsRaw =
    incoming?.topNews ||
    prep?.topNews ||
    s3?.topNews ||
    s3?.top_news ||
    s2?.topNews ||
    s2?.top_news ||
    [];

  const company = {
    name: s1?.company_name || s1?.company || "",
    website: s1?.company_website || s1?.website || "",
    /* Business model (on couvre un maximum de variantes) */
    businessModel:
      s2?.business_model ||
      s2?.businessModel ||
      s2?.model ||
      s2?.value_propositions ||
      s2?.value_proposition ||
      s2?.summary ||
      "",
    revenueStreams:
      toArray(s2?.revenue_streams || s2?.revenues || s2?.revenue || s2?.streams),
    pricing: toArray(s2?.pricing || s2?.prices || s2?.price),
    keyCustomers:
      toArray(s2?.customer_segments || s2?.segments || s2?.customers),
    topNews: Array.isArray(topNewsRaw)
      ? topNewsRaw.map(normalizeNewsItem).filter(Boolean)
      : [],
  };

  /* ----------------- Strategy (ex-SWOT) depuis step_3 ----------------- */
  const strategy = {
    strengths: toArray(s3?.strengths || s3?.plus || s3?.assets),
    weaknesses: toArray(s3?.weaknesses || s3?.gaps || s3?.risks),
    opportunities: toArray(s3?.opportunities || s3?.ops),
    threats: toArray(s3?.threats || s3?.competition || s3?.threat),
  };

  /* -------- Profile & Experience matching (step_4 / service match) ----- */
  const match =
    s4?.profileMatch || s4?.matchProfile || s4?.match_profile || s4?.match || null;

  let items: Array<{ requirement: string; evidence: string; score?: number }> = [];
  let matchScore: number | undefined;
  let summary: string | undefined;

  if (match) {
    matchScore = match.matchScore ?? match.score ?? undefined;
    summary = match.summary ?? undefined;

    const src = Array.isArray(match.items)
      ? match.items
      : Array.isArray(match.requirements)
      ? match.requirements
      : [];

    items = src.map((it: any) => {
      // on couvre plusieurs schémas de clés possibles
      const requirement =
        it.requirement || it.label || it.name || it.skill || "Requirement";
      const evidence =
        it.evidence || it.note || it.experience || it.details || "";
      const score =
        typeof it.score === "number"
          ? it.score
          : (typeof it.matchScore === "number" ? it.matchScore : undefined);
      return { requirement, evidence, score };
    });
  } else {
    // fallback auto à partir de skills/achievements si pas d’objet de match
    const raw = [
      ...toArray(s4?.key_skills),
      ...toArray(s4?.achievements),
    ];
    items = raw.map((txt) => ({
      requirement: "Skill/Achievement",
      evidence: txt,
    }));
    summary = s4?.personal_mission || undefined;
  }

  const profileMatch = { matchScore, summary, items };

  /* ------------------------------ WHY (step_5) ------------------------- */
  const why = {
    // tableaux
    whyCompany: toArray(s5?.why_company || s5?.why_them || s5?.why_this_company),
    whyRole: toArray(s5?.why_role || s5?.why_this_role),
    whyYou: [
      ...toArray(s5?.why_you),
      ...toArray(s5?.why_now),
      ...toArray(s5?.elevator_pitch),
    ],
  };

  /* --------------------------- Q&A (step_6) ---------------------------- */
  // On accepte de multiples schémas
  const forCandidateRaw =
    s6?.questions ||
    s6?.company_questions ||
    s6?.companyToCandidate ||
    s6?.questions_for_candidate ||
    s6?.questions_company_to_candidate ||
    [];

  const forCompanyRaw =
    s6?.questions_to_ask ||
    s6?.candidate_questions ||
    s6?.candidateToCompany ||
    s6?.questions_for_company ||
    s6?.questions_to_company ||
    [];

  const toQ = (q: any) => {
    if (typeof q === "string") return { question: q, answer: "", note: "" };
    return {
      question: q?.question || q?.q || "",
      answer: q?.answer || "",
      note: q?.tips || q?.note || "",
    };
    };

  const interview = {
    questionsForCandidate: Array.isArray(forCandidateRaw) ? forCandidateRaw.map(toQ) : [],
    questionsForCompany: Array.isArray(forCompanyRaw) ? forCompanyRaw.map(toQ) : [],
  };

  return {
    generatedAt: new Date().toISOString(),
    candidate: {
      name:
        s4?.candidate_name ||
        prep?.candidate_name ||
        (prep?.user && prep?.user?.name) ||
        "—",
    },
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
  for (const p of candidates) if (fs.existsSync(p)) return p;
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
