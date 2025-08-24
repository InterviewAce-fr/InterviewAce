import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

/* -------------------------------------------------------------------------- */
/*  Handlebars helpers                                                        */
/* -------------------------------------------------------------------------- */
let compiled: Handlebars.TemplateDelegate | null = null;
let helpersRegistered = false;

function registerHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;

  // Formats & utils
  Handlebars.registerHelper("formatDate", (iso?: string) =>
    iso ? dayjs(iso).format("DD/MM/YYYY HH:mm") : ""
  );
  Handlebars.registerHelper("join", (arr: any[], sep?: string) =>
    Array.isArray(arr) ? arr.join(sep || ", ") : ""
  );
  Handlebars.registerHelper("percent", (v: any) =>
    typeof v === "number" ? `${Math.round(v)}%` : v ?? ""
  );
  Handlebars.registerHelper("json", (ctx: any) => JSON.stringify(ctx, null, 2));

  // Logique
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b);
  Handlebars.registerHelper("not", (v: any) => !v);
  Handlebars.registerHelper("or", (...args: any[]) => {
    const vals = args.slice(0, -1);
    return vals.some(Boolean);
  });
  Handlebars.registerHelper("and", (...args: any[]) => {
    const vals = args.slice(0, -1);
    return vals.every(Boolean);
  });

  // Contenu
  Handlebars.registerHelper("notEmpty", (v: any) =>
    Array.isArray(v) ? v.length > 0 : !!v
  );
  Handlebars.registerHelper("hasContent", (v: any) => {
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return !!v;
  });
  Handlebars.registerHelper("coalesce", (...args: any[]) => {
    const vals = args.slice(0, -1);
    for (const v of vals) {
      if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return "";
  });
}

/* -------------------------------------------------------------------------- */
/*  Chargement du template                                                    */
/* -------------------------------------------------------------------------- */
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
  const raw = fs.readFileSync(templatePath(), "utf-8");
  compiled = Handlebars.compile(raw);
  return compiled;
}

/* -------------------------------------------------------------------------- */
/*  Normalisation                                                              */
/* -------------------------------------------------------------------------- */
function toArray(input: any): string[] {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input
      .map((x) => (typeof x === "string" ? x.trim() : x))
      .filter(Boolean);
  }
  if (typeof input === "string") {
    return input
      .split(/\r?\n|•|^- |\u2022|;|,/) // lignes, puces, tirets, ; ,
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toBullets(input: any): string[] {
  // plus permissif pour les champs "Why" (mais on évite de couper sur le ".")
  return toArray(input);
}

function mapTopNews(raw: any): Array<{
  title: string;
  url?: string;
  source?: string;
  date?: string;
  summary?: string;
  category?: string;
}> {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((n: any) => ({
      title: n?.title || n?.headline || "",
      url: n?.url || n?.link || "",
      source: n?.source || n?.publisher || "",
      date: n?.date || n?.publishedAt || "",
      summary: n?.summary || n?.description || "",
      category: n?.category || "",
    }))
    .filter((n) => n.title);
}

/* -------------------------------------------------------------------------- */
/*  Mapping preparation -> modèle pour le template                             */
/* -------------------------------------------------------------------------- */
export function prepareModel(
  prep: any,
  opts?: { showGenerateButton?: boolean; isPremium?: boolean }
) {
  const s1 = prep?.step_1_data || {};
  const s2 = prep?.step_2_data || {};
  const s3 = prep?.step_3_data || {};
  const s4 = prep?.step_4_data || {};
  const s5 = prep?.step_5_data || {};
  const s6 = prep?.step_6_data || {};

  const titleFromS1 = [s1?.job_title, s1?.company_name].filter(Boolean).join(" at ");

  // Step 2 — Business Model (toutes sections du canvas)
  const bm = {
    keyPartners: toArray(s2?.keyPartners),
    keyActivities: toArray(s2?.keyActivities),
    keyResources: toArray(s2?.keyResources),
    valuePropositions: toArray(s2?.valuePropositions),
    customerRelationships: toArray(s2?.customerRelationships),
    channels: toArray(s2?.channels),
    customerSegments: toArray(s2?.customerSegments),
    costStructure: toArray(s2?.costStructure),
    revenueStreams: toArray(s2?.revenueStreams),
  };

  // résumé court pour le paragraphe d’intro
  const valuePropSummary =
    bm.valuePropositions.length > 0
      ? bm.valuePropositions.slice(0, 2).join(" • ")
      : "";

  // Step 3 — SWOT + Top news
  const swot = {
    strengths: toArray(s3?.strengths),
    weaknesses: toArray(s3?.weaknesses ?? s3?.weeknesses), // compat fautes
    opportunities: toArray(s3?.opportunities),
    threats: toArray(s3?.threats),
  };

  const topNews =
    mapTopNews(
      s3?.topNews ||
        s3?.top_news ||
        s3?.news ||
        s3?.headlines ||
        prep?.topNews ||
        []
    ) || [];

  // Step 4 — Profile matching (table à partir des req/respons + réponses)
  const reqs = toArray(s1?.keyRequirements || s1?.key_requirements);
  const resps = toArray(s1?.keyResponsibilities || s1?.key_responsibilities);

  const reqAnswers: string[] = Array.isArray(s4?.requirementResponses)
    ? s4.requirementResponses
    : [];
  const respAnswers: string[] = Array.isArray(s4?.responsibilityResponses)
    ? s4.responsibilityResponses
    : [];

  const matches = Array.isArray(s4?.matchingResults?.matches)
    ? s4.matchingResults.matches
    : [];

  // index → meilleur score trouvé
  const bestScoreFor = (type: "requirement" | "responsibility", idx: number) => {
    const ms = matches.filter(
      (m: any) => m?.targetType === type && m?.targetIndex === idx
    );
    if (ms.length === 0) return null;
    return ms.reduce((max: number | null, m: any) => {
      const s = typeof m?.score === "number" ? m.score : null;
      if (s === null) return max;
      return max === null ? s : Math.max(max, s);
    }, null);
  };

  const profileItemsReq = reqs.map((r, i) => ({
    requirement: r,
    evidence: (reqAnswers[i] || "").trim(),
    score: bestScoreFor("requirement", i),
  }));

  const profileItemsResp = resps.map((r, i) => ({
    requirement: r,
    evidence: (respAnswers[i] || "").trim(),
    score: bestScoreFor("responsibility", i),
  }));

  const profileItems = [...profileItemsReq, ...profileItemsResp].filter(
    (x) => x.requirement || x.evidence || x.score !== null
  );

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
      // pour afficher la section même si on n’a pas de prose
      businessModel: valuePropSummary,
      // toutes les cases du canvas
      valueProps: bm.valuePropositions,
      keyPartners: bm.keyPartners,
      keyActivities: bm.keyActivities,
      keyResources: bm.keyResources,
      customerRelationships: bm.customerRelationships,
      channels: bm.channels,
      customerSegments: bm.customerSegments,
      costStructure: bm.costStructure,
      revenueStreams: bm.revenueStreams,
      // "pricing" conservé si jamais tu l’utilises plus tard
      pricing: toArray(s2?.pricing || s2?.pricingNotes || s2?.pricing_notes),
      // Top news
      topNews,
    },

    strategy: swot,

    profileMatch: {
      matchScore:
        typeof s4?.matchingResults?.overallScore === "number"
          ? Math.round(s4.matchingResults.overallScore)
          : null,
      summary: s4?.summary || "",
      items: profileItems,
    },

    // Step 5 — Why (converti en puces)
    why: {
      whyCompany: toBullets(s5?.whyCompany || s5?.why_company),
      whyRole: toBullets(s5?.whyRole || s5?.why_role),
      whyYou: toBullets(s5?.whyYou || s5?.why_you || s5?.whyNow || s5?.why_now),
    },

    // Step 6 — Q&A
    interview: (function () {
      // toutes les questions de l’entreprise → candidat (fusion des catégories)
      const catKeys = [
        "behavioral_questions",
        "technical_questions",
        "situational_questions",
        "company_questions",
        "career_questions",
        "personal_questions",
      ] as const;

      const forCandidate: Array<{ question: string; answer?: string; note?: string }> =
        catKeys
          .flatMap((k) => (Array.isArray(s6?.[k]) ? s6[k] : []))
          .filter((x: any) => x && (x.question || x.answer))
          .map((x: any) => ({
            question: x.question || "",
            answer: x.answer || "",
          }));

      // questions du candidat → entreprise (+ raison dans "note")
      const toCompany: Array<{ question: string; note?: string }> = Array.isArray(
        s6?.questions_to_ask
      )
        ? s6.questions_to_ask
            .filter((x: any) => x && (x.question || x.reason))
            .map((x: any) => ({ question: x.question || "", note: x.reason || "" }))
        : [];

      return {
        questionsForCandidate: forCandidate,
        questionsForCompany: toCompany,
      };
    })(),

    showGenerateButton: !!opts?.showGenerateButton,
    isPremium: !!opts?.isPremium,
    FRONTEND_URL: process.env.FRONTEND_URL || "",
  };

  return model;
}

/* -------------------------------------------------------------------------- */
/*  Rendu & PDF                                                               */
/* -------------------------------------------------------------------------- */
export function renderReport(model: any): string {
  const tpl = loadTemplate();
  return tpl(model);
}

export async function generatePDFReport(
  model: any,
  _opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(model);
  return htmlToPDF(html, _opts);
}
