import fs from "fs";
import path from "path";
import Handlebars from "handlebars";
import dayjs from "dayjs";
import { htmlToPDF } from "./pdfEngine";

/* -------------------------------------------------------------------------- */
/*                                Helpers HBS                                 */
/* -------------------------------------------------------------------------- */

let compiled: Handlebars.TemplateDelegate | null = null;
let helpersRegistered = false;

function isPlainObject(v: any) {
  return v && typeof v === "object" && !Array.isArray(v);
}

function popOptions(args: any[]) {
  // Dans un helper Handlebars, le dernier argument est l'objet options
  if (args.length && isPlainObject(args[args.length - 1]) && "hash" in args[args.length - 1]) {
    args = args.slice(0, -1);
  }
  return args;
}

function registerHelpers() {
  if (helpersRegistered) return;
  helpersRegistered = true;

  Handlebars.registerHelper("formatDate", (iso?: string, fmt?: string) =>
    iso ? dayjs(iso).format(fmt || "DD/MM/YYYY HH:mm") : ""
  );
  Handlebars.registerHelper("join", (arr: any[], sep?: string) =>
    Array.isArray(arr) ? arr.filter(Boolean).join(sep || ", ") : ""
  );
  Handlebars.registerHelper("percent", (v: any) =>
    typeof v === "number" ? `${Math.round(v)}%` : v ?? ""
  );

  // Bool / comparateurs
  Handlebars.registerHelper("eq", (a: any, b: any) => a === b);
  Handlebars.registerHelper("neq", (a: any, b: any) => a !== b);
  Handlebars.registerHelper("gt", (a: any, b: any) => Number(a) > Number(b));
  Handlebars.registerHelper("gte", (a: any, b: any) => Number(a) >= Number(b));
  Handlebars.registerHelper("lt", (a: any, b: any) => Number(a) < Number(b));
  Handlebars.registerHelper("lte", (a: any, b: any) => Number(a) <= Number(b));
  Handlebars.registerHelper("not", (a: any) => !a);

  Handlebars.registerHelper("and", function (...args: any[]) {
    args = popOptions(args);
    return args.every(Boolean);
  });
  Handlebars.registerHelper("or", function (...args: any[]) {
    args = popOptions(args);
    return args.some(Boolean);
  });

  Handlebars.registerHelper("coalesce", function (...args: any[]) {
    args = popOptions(args);
    for (const v of args) {
      if (Array.isArray(v) && v.length) return v;
      if (isPlainObject(v) && Object.keys(v).length) return v;
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return "";
  });

  Handlebars.registerHelper("notEmpty", (v: any) => {
    if (Array.isArray(v)) return v.filter(Boolean).length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    if (isPlainObject(v)) return Object.keys(v).length > 0;
    return !!v;
  });
}

/* -------------------------------------------------------------------------- */
/*                          Template load / compile                            */
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

  const filePath = templatePath();
  const raw = fs.readFileSync(filePath, "utf-8");
  compiled = Handlebars.compile(raw, { noEscape: true });
  return compiled;
}

/* -------------------------------------------------------------------------- */
/*                              Model preparation                              */
/* -------------------------------------------------------------------------- */

function asArray(v: any): string[] {
  if (Array.isArray(v)) return v.filter(Boolean);
  if (typeof v === "string") {
    const parts = v
      .split(/\r?\n|•|·|;|—|-{1,2}|\u2022/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : [v.trim()];
  }
  return [];
}

export function prepareModel(input: any, opts?: { showGenerateButton?: boolean; isPremium?: boolean }) {
  const prep = input?.preparationData ? input.preparationData : input || {};

  const s1 = prep.step_1_data || {};
  const s2 = prep.step_2_data || {};
  const s3 = prep.step_3_data || {};
  const s4 = prep.step_4_data || {};
  const s5 = prep.step_5_data || {};
  const s6 = prep.step_6_data || {};

  // --- Company Intelligence -------------------------------------------------
  // Timeline: string[] ou [{date,event}] → rendu compact "date — event"
  const timelineRaw =
    (Array.isArray(s2?.timeline) && s2.timeline) ||
    (Array.isArray(s3?.timeline) && s3.timeline) ||
    (Array.isArray(s2?.companyTimeline) && s2.companyTimeline) ||
    (Array.isArray(s3?.companyTimeline) && s3.companyTimeline) ||
    (Array.isArray(s2?.timeline_items) && s2.timeline_items) ||
    [];
  const timeline: string[] = timelineRaw
    .map((x: any) => {
      if (typeof x === "string") return x.trim();
      if (x && typeof x === "object") {
        const d = (x.date || x.when || "").toString().trim();
        const e = (x.event || x.title || x.text || "").toString().trim();
        return [d, e].filter(Boolean).join(" — ");
      }
      return "";
    })
    .filter(Boolean);

  // Competitors
  const competitorsRaw =
    (Array.isArray(s2?.competitors) && s2.competitors) ||
    (Array.isArray(s3?.competitors) && s3.competitors) ||
    [];
  const competitors = competitorsRaw
    .map((c: any) => ({
      name: String(c?.name ?? "").trim(),
      url: c?.url ? String(c.url) : "",
      country: c?.country ? String(c.country) : "",
      relative_size: c?.relative_size ? String(c.relative_size) : "",
      segment: c?.segment ? String(c.segment) : "",
      differentiators: Array.isArray(c?.differentiators)
        ? c.differentiators.filter(Boolean).map((d: any) => String(d))
        : [],
    }))
    .filter((c: any) => c.name);

  // Profile matching → table items
  const reqs: string[] =
    s1.key_requirements || s1.keyRequirements || s1.required_profile || [];
  const resps: string[] =
    s1.key_responsibilities || s1.keyResponsibilities || s1.responsibilities || [];

  // Évidences (compat deux conventions)
  const reqEvidences = s4?.requirementResponses || s4?.requirement_responses || [];
  const respEvidences = s4?.responsibilityResponses || s4?.responsibility_responses || [];

  // Meilleures correspondances avec score (compat deux conventions)
  const matchesArr: any[] = Array.isArray(s4?.matchingResults?.matches)
    ? s4.matchingResults.matches
    : (Array.isArray(s4?.matches) ? s4.matches : []);

  const bestScoreFor = (type: "requirement" | "responsibility", idx: number) => {
    const m = matchesArr
      .filter((x) => x?.targetType === type && Number(x?.targetIndex) === idx)
      .sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))[0];
    return typeof m?.score === "number" ? Math.max(0, Math.min(100, Math.round(m.score))) : null;
  };

  const reqItems = (reqs as string[]).map((r, i) => ({
    requirement: r,
    evidence: reqEvidences?.[i] || "",
    score: bestScoreFor("requirement", i),
  }));
  const respItems = (resps as string[]).map((r, i) => ({
    requirement: r,
    evidence: respEvidences?.[i] || "",
    score: bestScoreFor("responsibility", i),
  }));

  // Business model mapping (Step 2)
  const companyBM = {
    businessModel: s2.businessModel || "",
    valueProps: asArray(s2.valuePropositions),
    customerSegments: asArray(s2.customerSegments),
    channels: asArray(s2.channels),
    keyActivities: asArray(s2.keyActivities),
    keyResources: asArray(s2.keyResources),
    keyPartners: asArray(s2.keyPartners),
    customerRelationships: asArray(s2.customerRelationships),
    costStructure: asArray(s2.costStructure),
    revenueStreams: asArray(s2.revenueStreams),
  };

  // Top news (formats tolérés ; la route /pdf peut aussi faire un fetch de secours)
  const topNewsRaw =
    (Array.isArray(s3?.topNews) && s3.topNews) ||
    (Array.isArray(s3?.top_news) && s3.top_news) ||
    (Array.isArray(s3?.news) && s3.news) ||
    (Array.isArray(s2?.topNews) && s2.topNews) ||
    (Array.isArray(s2?.news) && s2.news) ||
    (Array.isArray(s3?.items) && s3.items) ||
    (Array.isArray(s2?.items) && s2.items) ||
    [];
  const topNews = topNewsRaw
    .map((n: any) => ({
      title: n?.title || n?.headline || "",
      url: n?.url || n?.link || "",
      source: n?.source || n?.publisher || "",
      date: n?.date || n?.publishedAt || "",
      summary: n?.summary || n?.description || "",
      category: n?.category || "",
    }))
    .filter((n: any) => n.title);

  const model = {
    generatedAt: new Date().toISOString(),
    title: prep.title || "",
    showGenerateButton: !!opts?.showGenerateButton,
    isPremium: !!opts?.isPremium,

    candidate: {
      name: s4?.candidateName || s1?.candidate_name || "",
      email: s4?.candidateEmail || "",
    },
    role: {
      title: s1?.job_title || "",
    },
    company: {
      name: s1?.company_name || "",
      website: s1?.company_website || "",
      ...companyBM,
      timeline,
      competitors,
      topNews,
    },

    strategy: {
      strengths: asArray(s3?.strengths),
      weaknesses: asArray(s3?.weaknesses || s3?.weeknesses), // compat
      opportunities: asArray(s3?.opportunities),
      threats: asArray(s3?.threats),
    },

    profileMatch: (s4?.matchingResults || reqItems.length || respItems.length) && {
      matchScore: (() => {
        const v = (typeof s4?.matchingResults?.overallScore === "number"
          ? s4.matchingResults.overallScore
          : (typeof s4?.overallScore === "number" ? s4.overallScore : null));
        return (typeof v === "number") ? Math.max(0, Math.min(100, Math.round(v))) : null;
      })(),
      items: [...reqItems, ...respItems].filter(
        (x) => x.requirement || x.evidence || typeof x.score === "number"
      ),
    },

    why: (s5?.whyCompany || s5?.whyRole || s5?.whyYou) && {
      whyCompany: asArray(s5?.whyCompany),
      whyRole: asArray(s5?.whyRole),
      whyYou: asArray(s5?.whyYou),
    },

    interview: (s6 && Object.keys(s6).length) && (function normalizeInterview(){
      const toQ = (q: any) => ({
        question: q?.question || q?.q || "",
        answer: q?.answer || q?.a || "",
        note: q?.note || q?.reason || "",
      });
      // Company → Candidate
      const qc = (
        ([] as any[]).concat(
          s6.behavioral_questions || [],
          s6.technical_questions || [],
          s6.situational_questions || [],
          s6.company_questions || [],
          s6.career_questions || [],
          s6.personal_questions || [],
          s6.qa_candidate || [],
          s6.all_questions || []
        ) || []
      ).map(toQ).filter((q) => q.question || q.answer || q.note);
      // Candidate → Company
      const qco = (s6.questions_to_ask || s6.qa_company || []).map((q: any) => ({
        question: q?.question || q?.q || "",
        note: q?.reason || q?.note || "",
      }));
      return { questionsForCandidate: qc, questionsForCompany: qco };
    })(),
  };

  return model;
}

/* -------------------------------------------------------------------------- */
/*                             Render / Generate                              */
/* -------------------------------------------------------------------------- */

export function renderReport(data: any): string {
  const tpl = loadTemplate();
  // On accepte soit un modèle déjà “préparé”, soit une payload bruelle
  const model = data?.preparationData || data?.strategy || data?.company
    ? data
    : prepareModel(data);

  return tpl(model);
}

export async function generatePDFReport(
  data: any,
  _opts?: { landscape?: boolean }
): Promise<Buffer> {
  const html = renderReport(data);
  const pdf = await htmlToPDF(html, _opts);
  return pdf;
}
